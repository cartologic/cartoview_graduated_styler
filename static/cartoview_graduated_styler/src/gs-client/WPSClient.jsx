import { getUrlWithQS } from './utils.jsx'
import {default as urlsHelper} from '../helpers/URLS.jsx'
import {getCRSFToken} from '../helpers/helpers.jsx'

const urlsHelperObj = new urlsHelper(URLS) // URLS defined it the template
const InputBuilder = {
    featureCollection: (identifier, featureType) => {
        return {
            identifier,
            reference: {
                mimeType: "text/xml; subtype=wfs-collection/1.0",
                href: "http://geoserver/wfs",
                method: "POST",
                body: {
                    wfs: {
                        version: "1.0.0",
                        outputFormat: "GML2",
                        featureType
                    }
                }
            }
        }
    },
    literalData: (identifier, value) => {
        return {
            identifier,
            data: {
                literalData: {
                    value
                }
            }
        }
    }
};
const OutputBuilder = (format) => {
    const formats = {
        xml: "text/xml",
        json: "application/json"
    }
    return {
        rawDataOutput: {
            identifier: "result",
            mimeType: formats[format]
        }
    }
}

class WPSClient {
    url = urlsHelperObj.getProxiedURL(URLS.wpsURL)
    gsUnique(featureType, attribute) {
        var inputs = {
            featureCollection: { features: featureType },
            literalData: { attribute }
        }
        return this.execute("gs:Unique", inputs, "json").then(res => {
            try{
                return res.json()
            }catch(err){
                throw err
            }
        })
    }
    /*
      options includes {attribute, stats, method, classes, noData}
    */
    vecFeatureClassStats(featureType, options) {     
        var inputs = {
            featureCollection: { features: featureType },
            literalData: options
        }
        return this.execute("vec:FeatureClassStats", inputs, "xml",featureType,options).then(res => res.text()).then(xml => {
        
            const doc = new DOMParser().parseFromString(xml, 'application/xml'),
                classes = doc.getElementsByTagName('Class')
            return Array.from(classes).map(c => {
                const min = c.getAttribute('lowerBound'),
                    max = c.getAttribute('upperBound'),
                    count = c.getAttribute('count');
                return { min, max, count, label: min + ' - ' + max };
            });
        });
    }
    execute(identifier, inputs, outputFormat) {
        var dataInputs = [];
        Object.keys(inputs).forEach((inputType) => {
            Object.keys(inputs[inputType]).forEach((key) => {
                dataInputs.push(InputBuilder[inputType](key, inputs[inputType][key]))
            });
 });
        var process = {
            identifier: identifier,
            responseForm: OutputBuilder(outputFormat),
            dataInputs: dataInputs
        }
     
      
        var xml = new OpenLayers.Format.WPSExecute().write(process);
        //TODO : Generate xml in  a better way
        if (identifier=="vec:FeatureClassStats"){
            var typeName = inputs.featureCollection.features
            var attribute = inputs.literalData.attribute
            var classes = inputs.literalData.classes
            var method = inputs.literalData.method
            var xml =`<?xml version="1.0" encoding="UTF-8"?>
                      <wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
                        <ows:Identifier>${identifier}</ows:Identifier>
                        <wps:DataInputs>
                            <wps:Input>
                            <ows:Identifier>features</ows:Identifier>
                            <wps:Reference mimeType="text/xml" xlink:href="http://geoserver/wfs" method="POST">
                                <wps:Body>
                                <wfs:GetFeature service="WFS" version="1.0.0" outputFormat="GML2" >
                                    <wfs:Query typeName="${typeName}"/>
                                </wfs:GetFeature>
                                </wps:Body>
                            </wps:Reference>
                            </wps:Input>
                            <wps:Input>
                            <ows:Identifier>attribute</ows:Identifier>
                            <wps:Data>
                                <wps:LiteralData>${attribute}</wps:LiteralData>
                            </wps:Data>
                            </wps:Input>
                            <wps:Input>
                            <ows:Identifier>classes</ows:Identifier>
                            <wps:Data>
                                <wps:LiteralData>${classes}</wps:LiteralData>
                            </wps:Data>
                            </wps:Input>
                            <wps:Input>
                            <ows:Identifier>method</ows:Identifier>
                            <wps:Data>
                                <wps:LiteralData>${method}</wps:LiteralData>
                            </wps:Data>
                            </wps:Input>
                        </wps:DataInputs>
                        <wps:ResponseForm>
                            <wps:RawDataOutput mimeType="text/xml">
                            <ows:Identifier>results</ows:Identifier>
                            </wps:RawDataOutput>
                        </wps:ResponseForm>
                        </wps:Execute>`}
    
        return fetch(this.url, {
            method: "POST",
            credentials: "include",
            body: xml,
            headers: new Headers({
                "Content-Type": "application/xml",
                "X-CSRFToken": getCRSFToken() 
            })
        });
    }
}

export default new WPSClient();
