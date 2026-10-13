sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Master.controller", "sap/ui/core/Fragment", "sap/ui/table/RowAction",
	"sap/ui/table/RowActionItem"
], function (BaseController, Fragment, RowAction, RowActionItem) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this.getView().byId("Input1").onsapenter = this.onSapEnterSearch;
			var e = this.getOwnerComponent().getEventBus();
			e.subscribe("reloadTermsMaster", this.reloadTermsMaster, this)
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("terms").attachPatternMatched(this._onPatternMatchedTermns, this);
		},
		_onPatternMatchedTermns: function(oEvent) {
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
								uname: oData.results[i].CreatorUname ,
								fullname: oData.results[i].CreatorFullName 
							};
							break;
						}
					}
					this.getModel("appModel").setProperty("/Deputy", oDeputy);
					this.testingPurpose();
				}.bind(this)
			});
		},
		reloadTermsMaster: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getView().byId("table").getBinding().refresh()
		},
		handleManageDeputyDialogPress: function (oEvent) {},
		onSearch: function(){
			this.getView().byId("filterBar").fireSearch();
		},
		onSapEnterSearch: function() {
			this.getParent().getParent().getParent().fireSearch();
		},
		onDetailRequestClick: function (oEvent) {
			var sTermId = oEvent.getSource().getParent().getParent().getBindingContext("TermService").getPath().split("('")[1].split("')")[0];
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if(Uname == '' || Uname == null || Uname == "SELF"){
				Uname = this.utf8_to_b64('SELF')
			}else{
				Uname= this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("detailTerm", {
				TermId: sTermId,
				Refresh: Uname
			})
		},
		onEditDRequestClick: function (oEvent) {
			var sTermId = oEvent.getSource().getParent().getParent().getBindingContext("TermService").getPath().split("('")[1].split("')")[0];
			this.getRouter().navTo("updateTerm", {
				TermId: sTermId
			})
		},
		onRequestPress: function () {
			this.getRouter().navTo("master", null, true)
		},
		onResetPress: function (oEvent) {
			oEvent.getSource().getFilterGroupItems()[0].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[2].getControl().setValue("");

			oEvent.getSource().getFilterGroupItems()[1].getControl().setSelectedItem(null);
			oEvent.getSource().getFilterGroupItems()[3].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[4].getControl().setValue("");
			oEvent.getSource().getFilterGroupItems()[5].getControl().setValue("");
			this.getView().byId("filterBar").fireSearch();
		},
		testingPurpose: function () {
			var e = this.onDetailRequestClick.bind(this);
			var t = this.onEditDRequestClick.bind(this);
			var o = "Multi";
			this.modes = [{
				key: "Navigation",
				text: "Navigation",
				handler: function () {
					var t = new RowAction({
						items: [new RowActionItem({
							type: "Navigation",
							press: e,
							visible: Boolean(this.getModel("appModel").getProperty("/MasterRequestSettings/TermDisplayO"))
						})]
					});
					return [1, t]
				}
			}, {
				key: "Multi",
				text: "Multiple Actions",
				handler: function () {
					var t = new RowAction({
						items: [new RowActionItem({
							type: "Navigation",
							press: e,
							visible: this.getBoolFromString(this.getModel("appModel").getProperty("/MasterRequestSettings/TermDisplayO"))
						})]
					});
					return [2, t]
				}.bind(this)
			}];
			var oTable = this.byId("table");
			var iCount = 0;
			var oTemplate = oTable.getRowActionTemplate();
			if (oTemplate) {
				oTemplate.destroy();
				oTemplate = null
			}
			for (var i = 0; i < this.modes.length; i++) {
				if (o == this.modes[i].key) {
					var aRes = this.modes[i].handler();
					iCount = aRes[0];
					oTemplate = aRes[1];
					break
				}
			}
			oTable.setRowActionTemplate(oTemplate);
			oTable.setRowActionCount(iCount)
		},
		getBoolFromString: function(oInput){
			if(oInput=='true'){
				return true;
			}	else return false;
		},
		openCreateTermDialog: function (oEvent) {
			var oView = this.getView();
			if (!this._createTermDialog) {
				this._createTermDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_DPO_REQUEST.fragment.CreateTermDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog
				})
			}
			this._createTermDialog.then(function (oDialog) {
				oDialog.open()
			}.bind(this))
		},
		onCreateTermDialogSuccess: function (oEvent) {
			var sFrequency = this.byId("ConcurencyTerm").getSelectedKey();
			if (sFrequency == "Jednou") {
				var dDateFrom = this.byId("DateInput").getDateValue();
				var dDateTo = this.byId("DateInput").getDateValue()
			} else {
				var dDateFrom = this.byId("DateRange").getFrom();
				var dDateTo = this.byId("DateRange").getTo()
			}
			dDateFrom.setHours(10);
			dDateTo.setHours(10);
			var sLocation = this.byId("LocationCreate").getValue();
			this.DialogToClose = oEvent.getSource().getParent();
			this.getView().getModel("TermService").callFunction("/CreateTerm", {
				method: "GET",
				urlParameters: {
					Frequency: sFrequency,
					DateFrom: dDateFrom,
					DateTo: dDateTo,
					Location: sLocation
				},
				success: function (oData, oResponse) {
					var sMsg = this.getView().getModel("i18n").getProperty("termCreated");
					sap.m.MessageToast.show(sMsg);
					this.getView().byId("table").getBinding().refresh();
					this.DialogToClose.close()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onRefreshPress: function (oEvent) {
			this.getView().byId("table").getBinding().refresh()
		},
		onConcurencyChange: function (oEvent) {
			if (oEvent.getSource().getSelectedKey() == "Jednou") {
				this.byId("DateRangeFormElement").setVisible(false);
				this.byId("DateInputFormElement").setVisible(true)
			} else {
				this.byId("DateRangeFormElement").setVisible(true);
				this.byId("DateInputFormElement").setVisible(false)
			}
		}
	})
});