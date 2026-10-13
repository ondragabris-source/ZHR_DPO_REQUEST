sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Master.controller", "sap/ui/core/Fragment", "sap/ui/table/RowAction",
	"sap/ui/table/RowActionItem"
], function (BaseController, Fragment, RowAction, RowActionItem) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("tasks").attachPatternMatched(this._onRouteMatched, this);
			var oEventBus = this.getOwnerComponent().getEventBus();
			this.getView().byId("Input1").onsapenter = this.onSapEnterSearch;
			this.getView().byId("Input2").onsapenter = this.onSapEnterSearch;
			this.getView().byId("Input3").onsapenter = this.onSapEnterSearch;

			var fnPressDetail = this.onItemPressed.bind(this);

			var that = this;
			this.modes = [{
				key: "Navigation",
				text: "Navigation",
				handler: function () {
					var oTemplate = new RowAction({
						items: [
							new RowActionItem({
								type: "Navigation",
								press: fnPressDetail
							})
						]
					});
					return [2, oTemplate];
				}
			}];
			this.switchState("Navigation");
		},

		switchState: function (sKey) {
			var oTable = this.byId("table");
			var iCount = 0;
			var oTemplate = oTable.getRowActionTemplate();
			if (oTemplate) {
				oTemplate.destroy();
				oTemplate = null;
			}

			for (var i = 0; i < this.modes.length; i++) {
				if (sKey == this.modes[i].key) {
					var aRes = this.modes[i].handler();
					iCount = aRes[0];
					oTemplate = aRes[1];
					break;
				}
			}

			oTable.setRowActionTemplate(oTemplate);
			oTable.setRowActionCount(iCount);
		},

		onItemPressed: function (oEvent) {
			var View = this.getView();
			this.ElementBindingView = oEvent.getSource().getBindingContext("TermService").getPath();
	
			var role = this.getModel("appModel").getProperty("/MasterRequestSettings/Role");
			if (role == "SP" || role == "ADMIN") {
					this._pDialog2 = Fragment.load({
						id: View.getId(),
						name: "ZHR_DPO_REQUEST.fragment.TaskUpdate",
						controller: this
					}).then(function (Event) {
						View.addDependent(Event);
						return Event;
					});
				this._pDialog2.then(function (Dialog) {
					Dialog.bindElement("TermService>" + this.ElementBindingView);
					Dialog.open();
				}.bind(this));
			} else {
				if (!this._pDialog1) {
					this._pDialog1 = Fragment.load({
						id: View.getId(),
						name: "ZHR_DPO_REQUEST.fragment.TaskDetailViewOnly",
						controller: this
					}).then(function (Event) {
						View.addDependent(Event);
						return Event;
					});
				}
				this._pDialog1.then(function (Dialog) {
					Dialog.bindElement("TermService>" + this.ElementBindingView);
					Dialog.open();
				}.bind(this));
			}
		},
		
		onUpdateSavePress: function (oEvent) {
			this.saveData("TermService").then(function(){
				var Bus = this.getOwnerComponent().getEventBus();
				Bus.publish("reloadRequestsMaster");
			}.bind(this));
			this.onDestroyDialog(oEvent);
		},

		onDpoReqFullPress: function (oEvent) {
			var sRequestId = oEvent.getSource().getParent().getBindingContext("TermService").getObject().DpoRequest
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("detailfromtasks", {
				RequestId: sRequestId,
				Refresh: Uname
			}, true)
		},

		handleManageDeputyDialogPress: function (oEvent) {},
		_onRouteMatched: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			this._Refresh = this.b64_to_utf8(oArgs.Refresh);

			this.getModel().read("/CreatorSet", {
				success: function (oData) {
					var oDeputy = {
						uname: '',
						fullname: ''
					};
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].CreatorUname == this._Refresh) {
							oDeputy = {
								uname: oData.results[i].CreatorUname,
								fullname: oData.results[i].CreatorFullName
							};
							break;
						}
					}
					this.getModel("appModel").setProperty("/Deputy", oDeputy);

					var aFilter
					this.getView().byId("table").bindRows({
						path: "TermService>/TaskSet"
					});
					if (this.getView().getModel("appModel").getProperty("/MasterRequestSettings/Role") == "SP" || this.getView().getModel("appModel").getProperty("/MasterRequestSettings/Role") == "ADMIN") {
						this.getView().byId("Uname").setValue('');
						aFilter = [new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "N")];
						this.getView().byId("table").getBinding("rows").filter(aFilter);
					} else {
						aFilter = [new sap.ui.model.Filter("Uname", sap.ui.model.FilterOperator.EQ, this._Refresh), new sap.ui.model.Filter("Status",
							sap.ui.model.FilterOperator.EQ, "N")];
						this.getView().byId("table").getBinding("rows").filter(aFilter);
						this.getView().byId("Uname").setValue(this._Refresh);
					}
				}.bind(this)
			});
		},
		onSearch: function () {
			this.getView().byId("filterBar").fireSearch();
		},
		onSapEnterSearch: function () {
			this.getParent().getParent().getParent().fireSearch();
		},
		reloadAgreementMaster: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getView().byId("table").getBinding().refresh();
		},

		onEditRequestClick: function (oEvent) {
			var sAgreementId = oEvent.getSource().getParent().getParent().getBindingContext("TermService").getPath().split("('")[1].split("')")[0];
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("createAgreement", {
				AgreementId: sAgreementId,
				Refresh: Uname
			});
		},
		onRequestPress: function () {
			this.getRouter().navTo("master", null, true);
		},
		onResetPress: function (oEvent) {
			oEvent.getSource().getFilterGroupItems()[1].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[2].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[3].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[4].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[5].getControl().setSelectedKey("N");
			this.getView().byId("filterBar").fireSearch();
		},
		testingPurpose: function () {
			var e = this.onDetailAgreementtClick.bind(this);
			var t = "Multi";
			this.modes = [{
				key: "Navigation",
				text: "Navigation",
				handler: function () {
					var t = new r({
						items: [new n({
							type: "Navigation",
							press: e,
							visible: "{Available}"
						})]
					});
					return [1, t];
				}
			}, {
				key: "Multi",
				text: "Multiple Actions",
				handler: function () {
					var t = new r({
						items: [new n({
							type: "Navigation",
							press: e,
							visible: "{Available}"
						})]
					});
					return [2, t];
				}
			}];
			var o = this.byId("table");
			var i = 0;
			var s = o.getRowActionTemplate();
			if (s) {
				s.destroy();
				s = null;
			}
			for (var a = 0; a < this.modes.length; a++) {
				if (t == this.modes[a].key) {
					var g = this.modes[a].handler();
					i = g[0];
					s = g[1];
					break;
				}
			}
			o.setRowActionTemplate(s);
			o.setRowActionCount(i);
		},
		onRefreshPress: function (oEvent) {
			this.getView().byId("table").getBinding().refresh();
		},
		onDestroyDialogWithReset: function (oEvent) {
			this.getModel("TermService").resetChanges();
			oEvent.getSource().getParent().destroy()
		}
	});
});