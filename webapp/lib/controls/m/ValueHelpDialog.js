sap.ui.define(["sap/ui/Device", "sap/m/Dialog", "sap/m/SearchField", "sap/m/Table", "sap/m/Column", "sap/m/ColumnListItem", "sap/m/ListMode", "sap/m/Bar", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/Button", "sap/m/ButtonType", "sap/m/Label", "sap/m/Text"], function(e, t, s, a, i, r, o, l, n, h, u, d, g, p) {
    "use strict";
    return t.extend("ZHR_DPO_REQUEST.lib.controls.m.ValueHelpDialog", {
        renderer: {},
        metadata: {
            properties: {
                showSearchField: {
                    type: "boolean",
                    group: "Behavior",
                    defaultValue: true
                },
                key: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                },
                mode: {
                    type: "sap.m.ListMode",
                    group: "Behavior",
                    defaultValue: o.None
                },
                columns: {
                    type: "string[]",
                    group: "Behavior",
                    defaultValue: []
                },
                selectedField: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                },
                enabledSelected: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                },
                filters: {
                    type: "string[]",
                    group: "Behavior",
                    defaultValue: []
                },
                searchFilters: {
                    type: "string[]",
                    group: "Behavior",
                    defaultValue: []
                },
                path: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                },
                selectedContexts: {
                    type: "string[]",
                    group: "Data",
                    defaultValue: []
                }
            }
        },
        constructor: function() {
            t.apply(this, arguments);
            this._setContent(arguments)
        },
        init: function(e) {
            t.prototype.init.apply(this, arguments)
        },
        _setContent: function() {
            this.oArgs = arguments[0][0];
            if (!this._bInitContent) {
                this._bInitContent = true;
                var t = new l;
                var c = new u({
                    visible: this.oArgs.mode !== o.SingleSelectMaster,
                    type: d.Emphasized,
                    text: "Vybrat"
                });
                var f = new u({
                    text: "Zavřít"
                });
                var m = new s;
                var b = [];
                var v = [];
                this.oArgs.columns.forEach(e => {
                    b.push(new i({
                        header: new g({
                            wrapping: true,
                            text: "{" + this.oArgs.path + "/" + e + "/#@sap:label}"
                        })
                    }));
                    v.push(new p({
                        wrapping: true,
                        text: {
                            path: e
                        }
                    }))
                });
                var y = new r({
                    cells: v
                });
                this._oTable = new a({
                    sticky: ["HeaderToolbar", "InfoToolbar", "ColumnHeaders"],
                    busyIndicatorDelay: 0,
                    growingThreshold: 100,
                    growing: true,
                    growingScrollToLoad: true,
                    mode: this.oArgs.mode,
                    columns: b,
                    updateFinished: () => {
                        this._oTable.getItems().forEach(e => {
                            var t = e.getBindingContext();
                            if (t) {
                                if (this.oArgs.selectedField && typeof this.oArgs.selectedField !== "function") {
                                    e.setSelected(t.getProperty(this.oArgs.key) === this.getBindingContext().getProperty(this.oArgs.selectedField))
                                }
                                if (this.oArgs.enabledSelected) {
                                    e._oSingleSelectControl.setEditable(t.getProperty(this.oArgs.enabledSelected))
                                }
                            }
                        })
                    },
                    items: {
                        path: this.oArgs.path,
                        filters: this.oArgs.filters,
                        template: y,
                        templateShareable: true,
                        events: {
                            dataReceived: () => {
                                this._oTable.setBusy(false)
                            },
                            dataRequested: () => {
                                this._oTable.setBusy(true)
                            }
                        }
                    }
                });
                this._oTable.removeSelections(true);
                c.attachPress(() => {
                    if (this._oTable.getSelectedContexts().length) {
                        this.close()
                    }
                });
                f.attachPress(() => {
                    this._oTable.removeSelections(true);
                    this.close()
                });
                this.attachAfterClose(() => {});
                this.attachAfterOpen(() => {
                    m.focus()
                });
                this._oTable.attachSelectionChange(e => {
                    if (this._oTable.getMode() === o.SingleSelectMaster) {
                        this.close()
                    }
                });
                var S = e => {
                    var t = [];
                    if (e && e.length > 2) {
                        if (this.oArgs.searchFilters && this.oArgs.searchFilters.length) {
                            this.oArgs.searchFilters.forEach(s => {
                                t.push(new n(s, h.Contains, e))
                            })
                        } else {
                            if (this.oArgs.columns[0] !== "CodelistValue") {
                                t.push(new n("SearchString", h.Contains, e))
                            } else {
                                t.push(new n("CodelistValue", h.Contains, e))
                            }
                        }
                    }
                    var s = new n(t, false);
                    this._oTable.getBinding("items").filter(t.length ? s : "")
                };
                m.attachSearch(e => {
                    var t = e.getParameter("query");
                    S(t)
                });
                m.attachLiveChange(e => {
                    var t = e.getParameter("newValue");
                    if (t.length > 2 || t.length === 0) {
                        S(t)
                    }
                });
                t.addContentMiddle(m);
                if (this.getShowSearchField()) {
                    this.setCustomHeader(t)
                }
                this.addContent(this._oTable);
                this.setBeginButton(c);
                this.setEndButton(f);
                this.setShowHeader(false);
                this.setStretch(!e.system.desktop);
                this.setContentWidth("700px");
                this.setResizable(true)
            }
        },
        getSelectedContexts: function() {
            return this._oTable.getSelectedContexts()
        }
    })
});