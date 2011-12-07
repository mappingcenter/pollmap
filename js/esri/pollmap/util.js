/**
 * @author alex6294
 */

dojo.provide("esri.pollmap.util");
dojo.require("esri.graphic");
dojo.declare("esri.pollmap.util.ExtentUtil", null, {
    _poly: null,
    _fs: null,
    extentToPolygon: function(extent){
        _poly = new esri.geometry.Polygon(extent.spatialReference);
        _poly.addRing([
        new esri.geometry.Point(extent.xmin, extent.ymin, extent.spatialReference), 
        new esri.geometry.Point(extent.xmax, extent.ymin, extent.spatialReference), 
        new esri.geometry.Point(extent.xmax, extent.ymax, extent.spatialReference), 
        new esri.geometry.Point(extent.xmin, extent.ymax, extent.spatialReference), 
        new esri.geometry.Point(extent.xmin, extent.ymin, extent.spatialReference)]);
        return _poly;
    },
    extentToFeatureSet: function(extent){
        _fs = new esri.tasks.FeatureSet();
        _fs.features = [new esri.Graphic(this.extentToPolygon(extent),null, null, null)];
        return _fs;
    } 
});
