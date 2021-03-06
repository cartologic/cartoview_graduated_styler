import json

import requests
from django.contrib.auth.decorators import login_required
from django.http import QueryDict, JsonResponse, HttpResponse
from django.shortcuts import render
from geonode.geoserver.helpers import ogc_server_settings, set_styles
from geonode.layers.views import _resolve_layer, _PERMISSION_MSG_MODIFY
from geoserver.catalog import Catalog

from . import APP_NAME, __version__
from .utils import repeat_every


@login_required
def index(request):
    context = {
        "v": __version__,
        "APP_NAME": APP_NAME,
        'username': request.user,
    }
    return render(request, "%s/index.html" % APP_NAME, context)


@login_required
def layer_styles(request, layername):
    # layer = _resolve_layer(request, layername, 'base.view_resourcebase')
    layer = _resolve_layer(request, layername, 'layers.change_layer_style')
    styles = []
    for style in layer.styles.all():
        styles.append({
            'name': style.name,
            'url': style.absolute_url(),
            'title': style.sld_title or style.name
        })
    return HttpResponse(json.dumps(styles), content_type="text/json")


username, password = ogc_server_settings.credentials
gs_catalog = Catalog(ogc_server_settings.rest, username, password)


@login_required
def save_style(request, layer_name, style_name):
    layer = _resolve_layer(
        request,
        layer_name,
        'layers.change_layer_style',
        _PERMISSION_MSG_MODIFY)
    workspace_name = layer_name.split(":")[0]
    # get style of geoserver
    style_func = repeat_every()(gs_catalog.get_style)
    style = style_func(style_name, workspace_name)
    # check if new style
    new = style is None
    xml = request.body
    gs_catalog.create_style(style_name, xml, True, workspace=layer_name.split(":")[0])
    if new:
        gs_layer = gs_catalog.get_layer(layer_name)
        style_func = repeat_every()(gs_catalog.get_style)
        style = style_func(style_name, workspace_name)
        gs_layer.styles += [style, ]
        gs_catalog.save(gs_layer)
    set_styles(layer, gs_catalog)
    return JsonResponse({"success": True}, status=200)


# gs_catalog = Catalog(ogc_server_settings.internal_rest, username, password)
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@login_required
def geoserver_rest_proxy(request, suburl):
    url = ogc_server_settings.LOCATION + "rest/" + suburl
    username, password = ogc_server_settings.credentials

    requests_args = dict()
    headers = get_headers(request.META)

    requests_args['headers'] = {}
    requests_args['data'] = request.body

    # Overwrite any headers and params from the incoming request with explicitly
    # specified values for the requests library.
    headers.update(requests_args['headers'])

    params = request.GET.copy()
    params.update(QueryDict('', mutable=True))
    requests_args['params'] = params
    # If there's a content-length header from Django, it's probably in all-caps
    # and requests might not notice it, so just remove it.
    for key in headers.keys():
        if key.lower() == 'content-length':
            del headers[key]

    requests_args['headers'] = headers

    response = requests.request(request.method, url, auth=(username, password), stream=True, **requests_args)
    kwargs = dict(status=response.status_code)
    if "Content-Type" in response.headers:
        kwargs["content_type"] = response.headers["Content-Type"]
    proxy_response = HttpResponse(response.content, **kwargs)

    return proxy_response


def get_headers(environ):
    """
    Retrieve the HTTP headers from a WSGI environment dictionary.  See
    https://docs.djangoproject.com/en/dev/ref/request-response/#django.http.HttpRequest.META
    """
    headers = {}
    for key, value in environ.items():
        # Sometimes, things don't like when you send the requesting host through.
        if key.startswith('HTTP_') and key != 'HTTP_HOST':
            headers[key[5:].replace('_', '-')] = value
        elif key in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            headers[key.replace('_', '-')] = value

    return headers
