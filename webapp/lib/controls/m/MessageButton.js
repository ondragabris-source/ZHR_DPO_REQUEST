sap.ui.define(["sap/m/Button", "sap/m/ButtonType", "sap/m/MessageView", "sap/m/MessageItem", "sap/ui/core/MessageType", "sap/m/Dialog", "sap/ui/core/IconPool"], function(e, s, t, i, a, o, n) {
    "use strict";
    var g = e.extend("zcafm.libs.controls.m.MessageButton", {
        renderer: {},
        metadata: {
            properties: {
                autoOpen: {
                    type: "boolean",
                    group: "Behavior",
                    defaultValue: false
                }
            },
            events: {
                messageReceived: {}
            }
        }
    });
    var r = sap.ui.getCore().getMessageManager();
    g.prototype.init = function() {
        e.prototype.init.apply(this, arguments);
        this._bFired = false;
        this.setIcon("sap-icon://error");
        this._initMessageModel();
        this.attachPress(this.openMessageDialog, this);
        this._bInicialized = true
    };
    g.prototype._initMessageModel = function() {
        this.oMessageModel = r.getMessageModel();
        this.bindProperty("visible", "messageModel>/", function(e) {
            return Boolean(e.length)
        });
        this.bindProperty("text", "messageModel>/", function(e) {
            if (!this._bFired) {
                this._bFired = true;
                jQuery.sap.delayedCall(0, {}, function() {
                    this._initProcessingMessage(e);
                    this.fireMessageReceived();
                    this._bFired = false
                }.bind(this))
            }
            this.mergeMessages();
            return this.oMessageModel.getData().length
        });
        this.setModel(this.oMessageModel, "messageModel")
    };
    g.prototype._initDialog = function() {
        if (!this._oMessageDialog) {
            var s = new t({
                showDetailsPageHeader: true,
                items: {
                    path: "messageModel>/",
                    template: new i({
                        description: "{messageModel>description}",
                        subtitle: "{messageModel>additionalText}",
                        type: "{messageModel>type}",
                        title: "{messageModel>message}"
                    })
                }
            });
            this._oMessageDialog = new o({
                contentHeight: "50%",
                contentWidth: "50%",
                resizable: true,
                verticalScrolling: false,
                showHeader: false,
                content: s
            });
            var a = new e({
                text: "Zavřít",
                press: () => {
                    this._oMessageDialog.close()
                }
            });
            this._oMessageDialog.addButton(a);
            this._oMessageDialog.attachAfterClose(e => {
                this._oMessageDialog.destroy();
                this._oMessageDialog = undefined
            });
            this.addDependent(this._oMessageDialog)
        }
    };
    g.prototype.cleanMessages = function() {
        this._cleanMessages()
    };
    g.prototype._cleanMessages = function() {
        if (this.getModel() && this._oMessageDialog) {
            if (this._oMessageDialog && this._oMessageDialog.isOpen()) {
                this._oMessageDialog.close()
            }
            sap.ui.getCore().getMessageManager().removeAllMessages()
        }
    };
    g.prototype._initProcessingMessage = function(e) {
        var s = e.length;
        if (this._oMessageDialog) {
            if (s === 0) {
                if (this._oMessageDialog && this._oMessageDialog.isOpen()) {
                    this._oMessageDialog.close()
                }
            }
        }
        this.setTypeByPriority(e);
        this.openByPriority(e)
    };
    g.prototype.setTypeByPriority = function(t) {
        var i = e.Default;
        var o = n.getIconURI("message-information");
        if (!t.length) {
            return
        }
        t.forEach(e => {
            if (e.getType() === a.Information) {
                i = s.Emphasized;
                o = n.getIconURI("message-information")
            }
        });
        t.forEach(e => {
            if (e.getType() === a.Success) {
                i = s.Success;
                o = n.getIconURI("message-success")
            }
        });
        t.forEach(e => {
            if (e.getType() === a.Warning) {
                i = s.Critical;
                o = n.getIconURI("message-warning")
            }
        });
        t.forEach(e => {
            if (e.getType() === a.Error) {
                i = s.Reject;
                o = n.getIconURI("message-error")
            }
        });
        this.setIcon(o);
        this.setType(i)
    };
    g.prototype.openByPriority = function(e) {
        var s = false;
        e.forEach(function(e) {
            if (e.getType() === a.Warning || e.getType() === a.Error || e.getTechnical()) {
                s = true
            }
        }.bind(this));
        if (s && this.getAutoOpen() && this.oMessageModel.getData().length) {
            this.openMessageDialog()
        }
        this.oMessageModel.refresh(true)
    };
    g.prototype.mergeMessages = function() {
        var e = [];
        this.oMessageModel.getData().forEach(function(s) {
            var t = true;
            e.forEach(function(e) {
                if (s.message === e.message) {
                    t = false
                }
            }.bind(this));
            if (t) {
                e.push(s)
            }
        }.bind(this));
        if (e.length) {
            this.oMessageModel.setData(e)
        }
    };
    g.prototype.registerControl = function(e) {
        this.attachMessageReceived(function() {
            if (e instanceof sap.ui.comp.filterbar.FilterBar) {
                e.getFilterGroupItems().forEach(function(e) {
                    var s = e.getControl();
                    var t = s.getName();
                    s.setValueState("None");
                    this.oMessageModel.getData().forEach(function(e) {
                        if ("/" + t === e.getTarget()) {
                            s.setValueState(e.getType());
                            s.setValueStateText(e.getMessage())
                        }
                    })
                }.bind(this))
            }
        }.bind(this))
    };
    g.prototype.openMessageDialog = function() {
        this._initDialog();
        this._oMessageDialog.open(this)
    };
    return g
});