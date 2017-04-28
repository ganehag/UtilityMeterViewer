(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['iec-table.html'] = template({"1":function(container,depth0,helpers,partials,data) {
    var alias1=container.escapeExpression, alias2=container.lambda;

  return "            <tr>\n                <td>"
    + alias1((helpers.counter || (depth0 && depth0.counter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(data && data.index),{"name":"counter","hash":{},"data":data}))
    + "</td>\n                <td>"
    + alias1(alias2((depth0 != null ? depth0.func : depth0), depth0))
    + "</td>\n                <td>"
    + alias1(alias2((depth0 != null ? depth0.value : depth0), depth0))
    + "</td>\n            </tr>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<table class=\"striped\">\n    <tbody>\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.records : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    </tbody>\n</table>";
},"useData":true});
templates['records-table.html'] = template({"1":function(container,depth0,helpers,partials,data) {
    var alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4=container.lambda;

  return "            <tr>\n                <td>"
    + alias3((helpers.counter || (depth0 && depth0.counter) || alias2).call(alias1,(data && data.index),{"name":"counter","hash":{},"data":data}))
    + "<br></td>\n                <td>"
    + alias3((helpers.fixround || (depth0 && depth0.fixround) || alias2).call(alias1,(depth0 != null ? depth0.value : depth0),{"name":"fixround","hash":{},"data":data}))
    + "<br>"
    + alias3(alias4((depth0 != null ? depth0.unit : depth0), depth0))
    + "</td>\n                <td>"
    + alias3(alias4((depth0 != null ? depth0.type : depth0), depth0))
    + "<br>"
    + alias3(alias4((depth0 != null ? depth0["function"] : depth0), depth0))
    + "</td>\n            </tr>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<table class=\"striped\">\n    <tbody>\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.records : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    </tbody>\n</table>\n";
},"useData":true});
templates['settings.html'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "              <option value=\""
    + alias4(((helper = (helper = helpers.value || (depth0 != null ? depth0.value : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"value","hash":{},"data":data}) : helper)))
    + "\" "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.selected : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</option>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "selected";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "              <option value=\""
    + alias4(((helper = (helper = helpers.addr || (depth0 != null ? depth0.addr : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"addr","hash":{},"data":data}) : helper)))
    + "\" "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.selected : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">"
    + alias4(((helper = (helper = helpers.addr || (depth0 != null ? depth0.addr : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"addr","hash":{},"data":data}) : helper)))
    + "</option>\n";
},"6":function(container,depth0,helpers,partials,data) {
    return "checked=\"checked\"";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "<form action=\"#\">\n    <div>\n        <h5>Meter-Bus</h5>\n        <br>\n        <div class=\"\">\n            <label>Baudrate</label>\n            <select id=\"settings-mbus-baudrate\" class=\"browser-default\" style=\"font-size: 140%;\">\n"
    + ((stack1 = helpers.each.call(alias1,((stack1 = (depth0 != null ? depth0.mbus : depth0)) != null ? stack1.baudrates : stack1),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n        </div>\n        <div class=\"\">\n            <label>Address</label>\n            <select id=\"settings-mbus-addr\" class=\"browser-default\" style=\"font-size: 140%;\">\n"
    + ((stack1 = helpers.each.call(alias1,((stack1 = (depth0 != null ? depth0.mbus : depth0)) != null ? stack1.addresses : stack1),{"name":"each","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n        </div>\n        <p>\n            <input type=\"checkbox\" id=\"settings-mbus-opto\" "
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.mbus : depth0)) != null ? stack1.optoWake : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " />\n            <label for=\"settings-mbus-opto\">Opto wake</label>\n        </p>\n\n        <br><br>\n\n        <h5>Kamstrup KMP</h5>\n\n        <p>\n            <input type=\"checkbox\" id=\"settings-kmp-legacy\" "
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.kmp : depth0)) != null ? stack1.legacy : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " />\n            <label for=\"settings-kmp-legacy\">Legacy mode (KMP4)</label>\n        </p>\n\n        <br><br>\n\n        <h5>IEC61107</h5>\n\n        <br>\n        <div class=\"\">\n            <label>Wakeup Rule</label>\n            <select id=\"settings-61107-wakeup\" class=\"browser-default\" style=\"font-size: 140%;\">\n"
    + ((stack1 = helpers.each.call(alias1,((stack1 = (depth0 != null ? depth0.iec61107 : depth0)) != null ? stack1.wakeup : stack1),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n        </div>\n\n        <p>\n            <input type=\"checkbox\" id=\"settings-61107-optional\" "
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.iec61107 : depth0)) != null ? stack1.optional : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "/>\n            <label for=\"settings-61107-optional\">Read optional data</label>\n        </p>\n    </div>\n</form>";
},"useData":true});
})();