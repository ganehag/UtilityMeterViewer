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
templates['kmp-table.html'] = template({"1":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "            <tr title=\""
    + alias2(alias1((depth0 != null ? depth0.desc : depth0), depth0))
    + "\">\n                <td>"
    + alias2((helpers.counter || (depth0 && depth0.counter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(data && data.index),{"name":"counter","hash":{},"data":data}))
    + "</td>\n                <td>"
    + alias2(alias1((depth0 != null ? depth0.func : depth0), depth0))
    + "</td>\n                <td>"
    + alias2(alias1((depth0 != null ? depth0.value : depth0), depth0))
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
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "            <option value=\""
    + alias4(((helper = (helper = helpers.addr || (depth0 != null ? depth0.addr : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"addr","hash":{},"data":data}) : helper)))
    + "\" title=\""
    + alias4(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"desc","hash":{},"data":data}) : helper)))
    + "\" "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.selected : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">"
    + alias4(((helper = (helper = helpers.reg || (depth0 != null ? depth0.reg : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"reg","hash":{},"data":data}) : helper)))
    + " | "
    + alias4(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"desc","hash":{},"data":data}) : helper)))
    + "</option>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "<form action=\"#\">\n    <div>\n        <h5>Meter-Bus</h5>\n        <br>\n        <div class=\"\">\n            <label>Baudrate</label>\n            <select id=\"settings-mbus-baudrate\" class=\"browser-default\" style=\"font-size: 140%;\">\n"
    + ((stack1 = helpers.each.call(alias1,((stack1 = (depth0 != null ? depth0.mbus : depth0)) != null ? stack1.baudrates : stack1),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n        </div>\n        <div class=\"\">\n            <label>Address</label>\n            <select id=\"settings-mbus-addr\" class=\"browser-default\" style=\"font-size: 140%;\">\n"
    + ((stack1 = helpers.each.call(alias1,((stack1 = (depth0 != null ? depth0.mbus : depth0)) != null ? stack1.addresses : stack1),{"name":"each","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n        </div>\n        <p>\n            <input type=\"checkbox\" id=\"settings-mbus-opto\" "
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.mbus : depth0)) != null ? stack1.optoWake : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " />\n            <label for=\"settings-mbus-opto\">Opto wake</label>\n        </p>\n\n        <br><br>\n\n        <h5>Kamstrup KMP</h5>\n\n        <div class=\"\">\n            <label for=\"settings-kmp-registers\">Registers</label>\n            <select id=\"settings-kmp-registers\" class=\"browser-default\" style=\"height: 10em; font-size: 130%;\" multiple>\n"
    + ((stack1 = helpers.each.call(alias1,((stack1 = (depth0 != null ? depth0.kmp : depth0)) != null ? stack1.registers : stack1),{"name":"each","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n        </div>\n\n        <p>\n            <input type=\"checkbox\" id=\"settings-kmp-legacy\" "
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.kmp : depth0)) != null ? stack1.legacy : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " />\n            <label for=\"settings-kmp-legacy\">Legacy mode (KMP4)</label>\n        </p>\n\n        <br><br>\n\n        <h5>IEC61107</h5>\n\n        <br>\n        <div class=\"\">\n            <label>Wakeup Rule</label>\n            <select id=\"settings-61107-wakeup\" class=\"browser-default\" style=\"font-size: 140%;\">\n"
    + ((stack1 = helpers.each.call(alias1,((stack1 = (depth0 != null ? depth0.iec61107 : depth0)) != null ? stack1.wakeup : stack1),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n        </div>\n\n        <p>\n            <input type=\"checkbox\" id=\"settings-61107-optional\" "
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.iec61107 : depth0)) != null ? stack1.optional : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "/>\n            <label for=\"settings-61107-optional\">Read optional data</label>\n        </p>\n    </div>\n</form>\n\n<div id=\"about-info\">\n    <p style=\"margin-top: 5em;\">\n        <h5>Utility Meter Viewer</h5>\n        <h6>developed and maintained by <a href=\"mailto:mikael.brorsson@gmail.com\" target=\"_blank\">Mikael Ganehag Brorsson</a></h6>\n        <p>Licensed under the <em>MIT License</em><p>\n        <p>Bitcoin donations: <a href=\"bitcoin:3LaGVDR8od2q3uq9RZNWpDRYLBaZZwMG7E\" target=\"_blank\">3LaGVDR8od2q3uq9RZNWpDRYLBaZZwMG7E</a><p>\n    </p>\n</div>";
},"useData":true});
})();