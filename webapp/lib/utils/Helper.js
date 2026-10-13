sap.ui.define(["sap/ui/model/odata/ODataUtils", "sap/ui/comp/filterbar/FilterBar", "sap/ui/Device", "sap/ui/core/Fragment"], function(e, t, a, r) {
    "use strict";
    return {
        openDialogSort: function(e, t, a) {},
        refreshContext: function(e) {
            var t = jQuery.Deferred();
            if (e) {
                var a = e.getModel();
                a.read(e.getPath(), {
                    success: function() {
                        t.resolve()
                    }
                })
            }
            return t.promise()
        },
        attachPressEnter: function(e) {},
        onChangeNumber: function(e) {
            var t = e.getParameter("value");
            var a = e.getSource();
            t = Number(t).toString();
            var r = a.getBindingContext();
            if (a.getMaxLength && a.getMaxLength()) {
                t = t.slice(0, a.getMaxLength())
            }
            a.getModel().setProperty(a.getBinding("value").getPath(), isNaN(t) ? "0" : t, r)
        },
        saveData: function(e, t) {
            var a = e.getPendingChanges();
            var r = jQuery.Deferred();
            jQuery.sap.delayedCall(0, null, function() {
                if (!t) {
                    jQuery.each(a, function(t, a) {
                        var r = new sap.ui.model.Context(e, "/" + t);
                        if ("Validate_Ac" in r.getObject()) {
                            e.setProperty("Validate_Ac", true, r)
                        }
                    })
                }
                if (!e) {
                    return false
                }
                if (!e.hasPendingChanges()) {
                    r.resolve()
                } else {
                    sap.ui.core.BusyIndicator.show(2e3);
                    e.submitChanges({
                        success: function() {
                            r.resolve()
                        },
                        error: function() {
                            r.reject()
                        }
                    });
                    r.always(function() {
                        sap.ui.core.BusyIndicator.hide()
                    })
                }
            }.bind(this));
            return r.promise()
        },
        isExistData: function(e, t, a, r, s) {
            a = a || "DataExist";
            e.getView().setBusy(true);
            var i = jQuery.Deferred();
            e.getModel().read("/" + a, {
                urlParameters: {},
                success: function(o, l) {
                    e.getView().setBusy(false);
                    o = o[a];
                    if (o.Per_Data_Exist) {
                        var u = {};
                        u[t] = o[t];
                        this.openDialogExistData(e, o, u, i, r, s)
                    } else {
                        i.reject()
                    }
                }.bind(this)
            });
            return i.promise()
        },
        onPressValueHelpFilter: function() {
            var e = new sap.m.Dialog({
                template: {
                    path: "/OrderTypeSet",
                    items: sap.m.StandardListItem()
                }
            });
            e.open()
        },
        getFilters: function(e, t) {
            var a = [];
            t = t || {};
            var r = e.getFilterGroupItems();
            var s;
            r.forEach(function(e, r) {
                var i = e.getControl();
                var o = i.getMetadata()._sClassName;
                var l = new Date(0).getTimezoneOffset() * 60 * 1e3;
                switch (o) {
                    case "sap.m.MultiInput":
                    case "sap.m.Input":
                        if (i.getValue()) {
                            var u = i.getValue();
                            u = u.replace(new RegExp("_", "g"), "###");
                            a.push(new sap.ui.model.Filter(i.getName(), t[i.getName()] || sap.ui.model.FilterOperator.EQ, u))
                        }
                        break;
                    case "sap.m.ComboBox":
                    case "sap.m.Select":
                        if (i.getSelectedKey()) {
                            a.push(new sap.ui.model.Filter(i.getName(), t[i.getName()] || sap.ui.model.FilterOperator.EQ, i.getSelectedKey()))
                        }
                        break;
                    case "sap.m.DatePicker":
                        if (i.getDateValue()) {
                            var n = i.getDateValue();
                            if (i.getValueFormat()) {
                                s = sap.ui.core.format.DateFormat.getDateTimeInstance({
                                    pattern: i.getValueFormat()
                                });
                                n = s.format(n)
                            } else {
                                n = new Date(i.getDateValue().setHours(23, 59, 59) - l)
                            }
                            a.push(new sap.ui.model.Filter(i.getName(), t[i.getName()] || sap.ui.model.FilterOperator.EQ, n))
                        }
                        break;
                    case "sap.m.Switch":
                        a.push(new sap.ui.model.Filter(i.getName(), t[i.getName()] || sap.ui.model.FilterOperator.EQ, i.getState()));
                        break;
                    case "sap.m.DateRangeSelection":
                        if (i.getFrom() && i.getTo()) {
                            var c = i.getFrom();
                            var p = i.getTo();
                            if (i.getValueFormat()) {
                                s = sap.ui.core.format.DateFormat.getDateTimeInstance({
                                    pattern: i.getValueFormat()
                                });
                                c = s.format(c);
                                p = s.format(p)
                            } else {
                                c = new Date(c.setHours(23, 59, 59) - l);
                                p = new Date(p.setHours(23, 59, 59) - l)
                            }
                            var m = [];
                            if (i.getName() && i.getName().split(",").length > 1) {
                                var g = i.getName().split(",");
                                m = [new sap.ui.model.Filter(g[0], sap.ui.model.FilterOperator.EQ, c), new sap.ui.model.Filter(g[1], sap.ui.model.FilterOperator.EQ, p)]
                            } else {
                                m = [new sap.ui.model.Filter(i.getName(), sap.ui.model.FilterOperator.GE, c), new sap.ui.model.Filter(i.getName(), sap.ui.model.FilterOperator.LE, p)]
                            }
                            a.push(new sap.ui.model.Filter(m, true))
                        }
                        break;
                    case "sap.m.MultiComboBox":
                        var f = [];
                        if (i.getSelectedKeys().length) {
                            i.getSelectedKeys().forEach(function(e) {
                                f.push(new sap.ui.model.Filter(i.getName(), sap.ui.model.FilterOperator.Contains, e))
                            });
                            a.push(new sap.ui.model.Filter(f, false))
                        }
                        break
                }
            });
            return a
        },
        filter: function(e, t, a, r, s) {
            var i = [];
            if (!this.validateFilter(t)) {
                return
            }
            if (t) {
                i = this.getFilters(t, s)
            }
            if (!jQuery.isEmptyObject(a)) {
                i.push(a)
            }
            var o = e.getBinding("sections") || e.getBinding("items") || e.getBinding();
            o.filter(i.length ? [new sap.ui.model.Filter(i, true)] : [])
        },
        validateFilter: function(e) {
            var t = true;
            var a = [];
            var r = e.getFilterGroupItems();
            r.forEach(function(e) {
                if (e.getControl().getRequired && e.getControl().getRequired()) {
                    a.push(e.getControl())
                }
            });
            jQuery.each(a, function(e, a) {
                var r = a.getMetadata()._sClassName;
                a.setValueState(sap.ui.core.ValueState.None);
                switch (r) {
                    case "sap.m.MultiInput":
                        if (!a.getTokens().length) {
                            t = false;
                            a.setValueState(sap.ui.core.ValueState.Error)
                        }
                        break;
                    case "sap.m.DateRangeSelection":
                        if (!a.getFrom()) {
                            t = false;
                            a.setValueState(sap.ui.core.ValueState.Error)
                        }
                        if (!a.getTo()) {
                            t = false;
                            a.setValueState(sap.ui.core.ValueState.Error)
                        }
                        break;
                    case "sap.m.ComboBox":
                    case "sap.m.Select":
                        if (!a.getSelectedKey()) {
                            t = false;
                            a.setValueState(sap.ui.core.ValueState.Error)
                        }
                        break;
                    case "sap.m.Input":
                        if (!a.getValue()) {
                            t = false;
                            a.setValueState(sap.ui.core.ValueState.Error)
                        }
                        break;
                    case "sap.m.DatePicker":
                        if (!a.getDateValue()) {
                            t = false;
                            a.setValueState(sap.ui.core.ValueState.Error)
                        }
                        break;
                    case "sap.m.MultiComboBox":
                        if (!a.getSelectedKeys()) {
                            t = false;
                            a.setValueState(sap.ui.core.ValueState.Error)
                        }
                        break
                }
            });
            return t
        },
        getRequestUrl: function(a, r, s, i) {
            var o = [];
            if (s instanceof t) {
                o = this.getFilters(s)
            }
            if (!jQuery.isEmptyObject(i)) {
                o.push(i)
            }
            var l = a.oMetadata._getEntityTypeByPath(r);
            var u = e.createFilterParams(o, a.oMetadata, l);
            if (s instanceof sap.m.Table) {
                u = s.getBinding("items").sFilterParams
            }
            var n = a.sServiceUrl + r;
            if (u) {
                n = n + "?" + u
            }
            return n
        },
        clearFilterBarControl: function(e) {
            var t = [];
            var a = e.getFilterGroupItems();
            a.forEach(function(e) {
                t.push(e.getControl())
            });
            jQuery.each(t, function(e, t) {
                var a = t.getMetadata()._sClassName;
                switch (a) {
                    case "sap.m.MultiInput":
                        t.setTokens([]);
                        break;
                    case "sap.m.DateRangeSelection":
                        t.setFrom();
                        t.setTo();
                        break;
                    case "sap.m.ComboBox":
                    case "sap.m.Select":
                        t.setSelectedKey();
                        break;
                    case "sap.m.Input":
                        t.setValue();
                        break;
                    case "sap.m.DatePicker":
                        t.setDateValue();
                        break;
                    case "sap.m.MultiComboBox":
                        t.setSelectedKeys();
                        break
                }
            })
        }
    }
});
