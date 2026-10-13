sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Master.controller", "sap/ui/table/RowAction", "sap/ui/table/RowActionItem",
	"sap/ui/core/Fragment", "sap/m/Dialog", "sap/m/Button"
], function (BaseController, RowAction, RowActionItem, Fragment, Dialog, Button) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._OriginCreator = "";
			this.testingPurpose();
			var e = this.getOwnerComponent().getEventBus();
			e.subscribe("reloadRequestsMaster", this.reloadRequestsMaster, this);
			var t = sap.ui.getCore().getEventBus();
			this.getView().byId("Input1").onsapenter = this.onSapEnterSearch;
			this.getView().byId("Input2").onsapenter = this.onSapEnterSearch;
			this.getView().byId("Input3").onsapenter = this.onSapEnterSearch;
			this.getView().byId("Input4").onsapenter = this.onSapEnterSearch;
			this._OriginCreator = "";
			
			if(this.getModel("appModel").getProperty("/Deputy/uname")){
				this.getView().byId('CreatorComboBox').setSelectedKey(this.getModel("appModel").getProperty("/Deputy/uname"));
				this.getView().byId('CreatorComboBox').fireChange();
			}
			jQuery.sap.registerModulePath("skoda.hr.support", "/sap/bc/ui5_ui5/sap/zpe_all_support");
			this._oCCSupport = this.getView().byId("idSupport");
			this._oCompSupport = sap.ui.getCore().createComponent({
				name: "skoda.hr.support",
				settings: {
					componentData: {
						applicationId: "ZHR_DPO_REQUEST",
						type: "ICON"
					}
				}
			});
			this._oCCSupport.setComponent(this._oCompSupport);
			t.subscribe(skoda.hr.support.Component.EvenBus_ChannelId, skoda.hr.support.Component.EvenId_UserChanged, this.reloadMasterView, this)
		},
		reloadRequestsMaster: function (e) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getView().byId("table").getBinding().refresh();
		},
		reloadMasterView: function (e) {
			this.getModel().read("/AuthStrucSet(DpoRequest='0',Uname='" + this._OriginCreator + "')", {
				success: function (e) {
					this.getModel("appModel").setProperty("/MasterRequestSettings", e)
				}.bind(this)
			});
			this.getView().byId("CreatorComboBox").getBindingInfo("items").binding.refresh();
			this.getView().byId("CreatorComboBox").setSelectedKey("");
			this._OriginCreator = "";
			this.getView().byId("CreatorUname").setValue("");
			this.reloadRequestsMaster();
		},
		onResetPress: function (e) {
			e.getSource().getFilterGroupItems()[1].getControl().setValue("");
			e.getSource().getFilterGroupItems()[2].getControl().setValue("");
			e.getSource().getFilterGroupItems()[3].getControl().setValue("");
			e.getSource().getFilterGroupItems()[4].getControl().setValue("");
			e.getSource().getFilterGroupItems()[5].getControl().setSelectedKey("");
			e.getSource().getFilterGroupItems()[6].getControl().setSelectedKey("");
			e.getSource().getFilterGroupItems()[7].getControl().setValue("");
			e.getSource().getFilterGroupItems()[8].getControl().setValue("");
			e.getSource().getFilterGroupItems()[9].getControl().setSelectedKey("");
			this.getView().byId("filterBar").fireSearch();
		},

		_getDialog: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("ZHR_DPO_REQUEST.fragment.ManageDeputy");
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		onOpenDialog: function () {
			this._getDialog().open();
		},
		onSearch: function () {
			this.getView().byId("filterBar").fireSearch();
		},
		onSapEnterSearch: function () {
			//this.getView().byId("filterBar").fireSearch();
			this.getParent().getParent().getParent().fireSearch();
		},
		onCreaterChange: function (e) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this._OriginCreator = e.getSource().getSelectedKey();
			this.getView().byId("CreatorUname").setValue(this._OriginCreator);
			this.getView().byId("filterBar").fireSearch();
			var t = {
				uname: e.getSource().getSelectedKey(),
				fullname: e.getSource()._getSelectedItemText()
			};
			this.getModel("appModel").setProperty("/Deputy", t);
			this.getModel().read("/AuthStrucSet(DpoRequest='0',Uname='" + this._OriginCreator + "')", {
				success: function (e) {
					this.getModel("appModel").setProperty("/MasterRequestSettings", e)
				}.bind(this)
			})
		},
		handleManageDeputyDialogPress: function (e) {
			var t = this.getView();
			if (!this.oDefaultDialog) {
				this.oDefaultDialog = new Dialog({
					title: "Available Products",
					content: Fragment.load({
						id: t.getId(),
						name: "ZHR_DPO_REQUEST.fragment.ManageDeputy",
						controller: this
					}),
					beginButton: new Button({
						text: "OK",
						press: function () {
							this.oDefaultDialog.close()
						}.bind(this)
					}),
					endButton: new Button({
						text: "Close",
						press: function () {
							this.oDefaultDialog.close()
						}.bind(this)
					})
				});
				this.getView().addDependent(this.oDefaultDialog)
			}
			this.oDefaultDialog.open();
			var t = this.getView();
			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: t.getId(),
					name: "ZHR_DPO_REQUEST.fragment.ManageDeputy",
					controller: this
				}).then(function (e) {
					t.addDependent(e);
					return e
				})
			}
			this._pDialog.then(function (e) {
				e.open()
			})
		},
		testingPurpose: function () {
			var e = this.handleManageDeputyDialogPress.bind(this);
			var i = this.onDetailRequestClick.bind(this);
			var o = this.onEditDRequestClick.bind(this);
			var r = "Multi";
			this.modes = [{
				key: "Navigation",
				text: "Navigation",
				handler: function () {
					var e = new RowAction({
						items: [new RowActionItem({
							type: "Navigation",
							press: i,
							visible: "{Available}"
						})]
					});
					return [1, e]
				}
			}, {
				key: "Multi",
				text: "Multiple Actions",
				handler: function () {
					var e = new RowAction({
						items: [new RowActionItem({
							type: "Navigation",
							press: i,
							visible: "{Available}"
						})]
					});
					return [2, e]
				}
			}];
			var n = this.byId("table");
			var a = 0;
			var g = n.getRowActionTemplate();
			if (g) {
				g.destroy();
				g = null
			}
			for (var u = 0; u < this.modes.length; u++) {
				if (r == this.modes[u].key) {
					var l = this.modes[u].handler();
					a = l[0];
					g = l[1];
					break
				}
			}
			n.setRowActionTemplate(g);
			n.setRowActionCount(a)
		},
		onTableNavigation: function (e) {},
		onDetailRequestClick: function (e) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var t = e.getSource().getBindingContext().getObject().DpoRequest;
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("detail", {
				RequestId: t,
				Refresh: Uname
			}, true)
		},
		onSubsitutePress: function (e) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getRouter().navTo("substitute", null, true)
		},
		onTermsPress: function (e) {
			var t = this.getOwnerComponent().getEventBus();
			t.publish("reloadTermsMaster");
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}

			this.getRouter().navTo("terms", {
				Refresh: Uname
			}, true)
		},
		onAgreementsPress: function (e) {
			var t = this.getOwnerComponent().getEventBus();
			t.publish("reloadAgreementMaster");
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("agreements", {
				Refresh: Uname
			}, true)
		},
		onTaksPress: function (e) {
			var t = this.getOwnerComponent().getEventBus();
			//t.publish("reloadAgreementMaster");
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("tasks", {
				Refresh: Uname
			}, true)
		},
		onEditDRequestClick: function (e) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var t = e.getSource().getParent().getParent().getCells()[2].getText();
			t = t.split("/")[0];
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("update", {
				RequestId: t,
				Refresh: Uname
			})
		},
		onHelpPress: function () {
			this.getView().getModel().callFunction("/GetPDFLink", {
				method: "GET",
				urlParameters: {
					button_press: "DPO_NAVODKA"
				},
				success: function (e, t) {
					if(e.PDFlink==""){
						window.open("https://space.tskoda.vwgroup.com/", '_blank').focus();
					} else {
						window.open(e.PDFlink, '_blank').focus();
					}
				}.bind(this),
				error: function (e) {
					sap.m.MessageToast.show(e)
				}.bind(this)
			})
		},
		
		onCreateRequestClick: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getView().getModel().callFunction("/Create", {
				method: "GET",
				urlParameters: {
					CreateReq: "CreateReq",
					OriginUser: this._OriginCreator
				},
				success: function (e, t) {
					this.getRouter().navTo("create", {
						RequestId: e.DpoRequest,
						Refresh: Uname
					})
				}.bind(this),
				error: function (e) {
					sap.m.MessageToast.show(e)
				}.bind(this)
			})
		},
		bind: function () {
			this.oArgs.Preview = true;
			this.getModel("appModel").setProperty("/edit", false);
			this._bind("/EquipmentDetailSet")
		},
		refreshDataMaster: function () {
			this.byId("table").getBinding("rows").refresh()
		},
		refreshDataDetail: function () {
			this.refreshContext(this.getView().getBindingContext())
		},
		onPressExport: function (e) {
			var t = ["Equnr", "Eqktx", "EqartText", "EqtypText", "AdminName", "Pltxt", "ZzBuildingText", "ZzFloor", "ZzRoomText", "Txt30",
				"OperPriorityText", "RespName", "ZzAlttxtEquip", "ZzFunctionSyst", "ZzTechnicalSyst", "Serge", "Groes", "Kostl", "Herst", "Typbz",
				"Baujj", "Warranty", "Gwldt", "Gwlen", "Inbdt", "OwnerName", "LifnrName", "Investment", "PosidText"
			];
			this.exportExcel(e, t)
		},

		 
	})
});