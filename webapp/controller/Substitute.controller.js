sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller", "sap/ui/core/Fragment", "sap/ui/table/RowAction", "sap/ui/table/RowActionItem", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/Dialog", "sap/m/DialogType", "sap/m/Button", "sap/m/ButtonType", "sap/m/Text"], function (BaseController, Fragment, RowAction, RowActionItem, Filter, FilterOperator, Dialog, DialogType, Button, ButtonType, Text) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this.testingPurpose()
		},
		openChangeDeputyDialog: function (e) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.ChangeDeputyBindingPath = e.getSource().getParent().getParent().getBindingContext().getPath();
			var i = this.getView();
			if (!this._editDeputyDialog) {
				this._editDeputyDialog = Fragment.load({
					id: i.getId(),
					name: "ZHR_DPO_REQUEST.fragment.EditDeputy",
					controller: this
				}).then(function (e) {
					i.addDependent(e);
					return e
				})
			}
			this._editDeputyDialog.then(function (e) {
				e.bindElement(this.ChangeDeputyBindingPath);
				e.open()
			}.bind(this))
		},
		testingPurpose: function () {
			var e = this.openChangeDeputyDialog.bind(this);
			var t = this.onDeleteDeputyDialog.bind(this);
			var o = "Edit";
			this.modes = [{
				key: "Edit",
				text: "Edit",
				handler: function () {
					var e = new RowAction({
						items: [new RowActionItem({
							icon: "sap-icon://delete",
							press: t,
							visible: "{Available}"
						})]
					});
					return [1, e]
				}
			}];
			var s = this.byId("table");
			var a = 0;
			var r = s.getRowActionTemplate();
			if (r) {
				r.destroy();
				r = null
			}
			for (var l = 0; l < this.modes.length; l++) {
				if (o == this.modes[l].key) {
					var g = this.modes[l].handler();
					a = g[0];
					r = g[1];
					break
				}
			}
			s.setRowActionTemplate(r);
			s.setRowActionCount(a)
		},
		onAddDeputyPress: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var e = this.getView();
			this._createDeputyDialog = Fragment.load({
				id: e.getId(),
				name: "ZHR_DPO_REQUEST.fragment.CreateDeputy",
				controller: this
			}).then(function (t) {
				e.addDependent(t);
				return t
			});
			this._createDeputyDialog.then(function (e) {
				this.DialogToClose = e;
				e.open()
			}.bind(this))
		},
		onAddDeputyConfirmPress: function (e) {
			var t = this.byId("RoleDeputySelection").getSelectedKey();
			this.getView().getModel().create("/DeputySet", {
				CreatorDeputy: this.NextPersonPernr,
				Activity: t
			}, {
				success: function (e) {
					var t = this.getView().getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(t);
					this.DialogToClose.destroy()
				}.bind(this),
				error: function (e) {
					sap.m.MessageToast.show(e);
					this.getView().setBusy(false)
				}.bind(this)
			})
		},
		onEditDeputyConfirmPress: function (e) {
			var t = this.byId("RoleDeputySelection").getSelectedKey();
			this.getView().getModel().update(e.getSource().getBindingContext().getPath(), {
				Activity: t
			}, {
				success: function (e) {
					var t = "Success.";
					sap.m.MessageToast.show(t);
					this.DialogToClose.close()
				}.bind(this),
				error: function (e) {
					var t = "Error.";
					sap.m.MessageToast.show(e);
					this.getView().setBusy(false)
				}.bind(this)
			})
		},
		onCloseDialog: function (e) {
			e.getSource().getParent().destroy()
		},
		onNavBack: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var e = sap.ui.core.UIComponent.getRouterFor(this);
			e.navTo("master", true)
		},
		onPeopleValueHelpRequest: function (e) {
			var i = e.getSource().getValue(),
				n = this.getView();
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: n.getId(),
					name: "ZHR_DPO_REQUEST.fragment.PeopleValueHelp",
					controller: this
				}).then(function (e) {
					n.addDependent(e);
					return e
				})
			}
			this._pValueHelpDialog.then(function (e) {
				e.open(i)
			})
		},
		onValuePersonHelpSearch: function (e) {
			var t = e.getParameter("value");
			var i = new Filter({
				filters: [new Filter("Pernr", FilterOperator.EQ, t), new Filter("Uname", FilterOperator.EQ, t), new Filter("Fullname", FilterOperator.EQ, t)],
				and: true
			});
			e.getSource().getBinding("items").filter(i)
		},
		onValueHelpPersonChosen: function (e) {
			this.byId("SelectedPersonDeputy").setValue(e.getParameter("selectedItem").getTitle());
			this.NextPersonPernr = e.getParameter("selectedItem").getNumberUnit();
			this.byId("SelectedPersonDeputy").fireLiveChange()
		},
		onDeleteDeputyDialog: function (e) {
			if (!this.oDeleteRequestTotermDialog) {
				this.oDeleteRequestTotermDialog = new Dialog({
					type: DialogType.Message,
					title: this.getView().getModel("i18n").getProperty("removeDeputyTitle"),
					content: new Text({
						text: this.getView().getModel("i18n").getProperty("removeDeputyText")
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.getModel("i18n").getProperty("yes"),
						press: function (e) {
							this.deleteDeputy(e);
							this.oDeleteRequestTotermDialog.close()
						}.bind(this)
					}),
					endButton: new Button({
						text: this.getView().getModel("i18n").getProperty("no"),
						press: function () {
							this.oDeleteRequestTotermDialog.close()
						}.bind(this)
					})
				})
			}
			this.oDeleteRequestTotermDialog.setBindingContext(e.getParameter("item").getBindingContext().getPath());
			this.oDeleteRequestTotermDialog.open()
		},
		deleteDeputy: function (e) {
			this.getView().getModel().remove(e.getSource().getBindingContext(), {
				method: "DELETE",
				success: function (e) {
					var t = this.getView().getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(t);
					var i = this.getView().byId("table");
					i.getBinding().refresh()
				}.bind(this),
				error: function (e) {
					sap.m.MessageToast.show(e);
					this.getView().setBusy(false)
				}
			})
		}
	})
});