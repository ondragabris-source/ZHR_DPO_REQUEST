sap.ui.define(["sap/m/Input", "sap/m/Dialog", "sap/m/SearchField", "sap/m/List", "sap/m/StandardListItem", "sap/m/ListMode", "sap/m/Bar", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/Button"], function(e, t, a, i, l, s, n, o, r, p) {
    "use strict";
    return e.extend("ZHR_DPO_REQUEST.lib.controls.m.Input", {
        renderer: {},
        metadata: {
            properties: {
                key: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                },
                valueHelpKey: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                },
                valueHelpText: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                },
                valueHelpPath: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                }
            }
        },
        init: function() {
            window.I = this;
            e.prototype.init.apply(this, arguments);
            this._setEvents()
        },
        _setEvents: function() {
            this.attachValueHelpRequest(this.openValueHelpDialog, this)
        },
        openValueHelpDialog: function() {
            if (!this._oDialog) {
                var e = new n;
                var u = new p({
                    text: "Zavřít"
                });
                this.oDialog = new t({
                    customHeader: e,
                    stretch: "{= !${device>/system/desktop}}",
                    showHeader: false,
                    buttons: u
                });
                var h = new a;
                var d = new l({
                    title: {
                        path: this.getValueHelpText()
                    },
                    description: {
                        path: this.getValueHelpKey()
                    }
                });
                var g = new i({
                    mode: s.SingleSelectMaster,
                    items: {
                        path: this.getValueHelpPath(),
                        template: d
                    }
                });
                u.attachPress(() => {
                    this.oDialog.close()
                });
                g.attachSelectionChange(e => {
                    var t = e.getParameter("listItem");
                    var a = t.getBindingContext();
                    this.setKey(a.getProperty(this.getValueHelpKey()));
                    this.oDialog.close()
                });
                h.attachSearch(e => {
                    var t = e.getParameter("query");
                    var a = [];
                    if (t) {
                        a.push(new o(this.getValueHelpText(), r.Contains, t))
                    }
                    g.getBinding("items").filter(a)
                });
                e.addContentMiddle(h);
                this.oDialog.addContent(g);
                this.addDependent(this.oDialog)
            }
            this.oDialog.open()
        }
    })
});