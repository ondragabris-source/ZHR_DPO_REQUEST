sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Master.controller", "sap/ui/table/RowAction",
	"sap/ui/table/RowActionItem"
], function (BaseController, RowAction, RowActionItem) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this.testingPurpose();
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("agreements").attachPatternMatched(this._onRouteMatched, this);
			var e = this.getOwnerComponent().getEventBus();
			e.subscribe("reloadAgreementMaster", this.reloadAgreementMaster, this);
			this.getView().byId("Input1").onsapenter = this.onSapEnterSearch;
			this.getView().byId("Input2").onsapenter = this.onSapEnterSearch;
			this.getView().byId("Input3").onsapenter = this.onSapEnterSearch;
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
					this.getView().byId("CreatorUname").setValue(this.getModel("appModel").getProperty("/Deputy/uname"));
					if (this.getModel("appModel").getProperty("/Deputy/uname") !== null) {
						this.getView().byId("filterBar").fireSearch();
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
		onDetailAgreementtClick: function (oEvent) {
			var sAgreementId = this.getModel("AgrService").getData(oEvent.getSource().getParent().getParent().getBindingContext("AgrService").getPath()).DpoAgreement;
			var sRequestId = this.getModel("AgrService").getData(oEvent.getSource().getParent().getParent().getBindingContext("AgrService").getPath()).DpoRequest;
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if(Uname == '' || Uname == null || Uname == "SELF"){
				Uname = this.utf8_to_b64('SELF')
			}else{
				Uname= this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("detailAgreement", {
				AgreementId: sAgreementId,
				RequestId: sRequestId,
				Refresh: Uname
			});
		},
		onEditRequestClick: function (oEvent) {
			var sAgreementId = oEvent.getSource().getParent().getParent().getBindingContext("TermService").getPath().split("('")[1].split("')")[0];
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if(Uname == '' || Uname == null || Uname == "SELF"){
				Uname = this.utf8_to_b64('SELF')
			}else{
				Uname= this.utf8_to_b64(Uname);
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
			oEvent.getSource().getFilterGroupItems()[2].getControl().setSelectedKey("");
			oEvent.getSource().getFilterGroupItems()[3].getControl().setSelectedKey("");
			oEvent.getSource().getFilterGroupItems()[4].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[5].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[6].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[7].getControl().setValue("");
			this.getView().byId("filterBar").fireSearch();
		},
		testingPurpose: function () {
			var e = this.onDetailAgreementtClick.bind(this);
			var t = "Multi";
			this.modes = [{
				key: "Navigation",
				text: "Navigation",
				handler: function () {
					var t = new RowAction({
						items: [new RowActionItem({
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
					var t = new RowAction({
						items: [new RowActionItem({
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
	});
});