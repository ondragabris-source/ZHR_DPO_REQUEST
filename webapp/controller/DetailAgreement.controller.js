sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller", "sap/ui/model/Filter", "sap/ui/core/Fragment",
	"sap/m/Dialog", "sap/m/DialogType", "sap/m/Button", "sap/m/ButtonType",
	"sap/m/Text"
], function (BaseController, Filter, Fragment, Dialog, DialogType, Button, ButtonType, Text) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("detailAgreement").attachPatternMatched(this._onPatternMatched, this)
		},
		_onPatternMatched: function (oEvent) {
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
			this._AgreementId = oArgs.AgreementId;
			this._RequestId = oArgs.RequestId;
			this._Refresh = this.b64_to_utf8(oArgs.Refresh);
			this.getModel("AgrService").read("/AuthStrucSet(DpoRequest='" + this._RequestId + "',Uname='" + this.getModel("appModel").getProperty(
				"/Deputy/uname") + "')", {
				success: function (oData) {
					this.getModel("appModel").setProperty("/DetailAgreementSettings", oData)
				}.bind(this)
			});
			this._bindElement(this._AgreementId)
		},
		_bindElement: async function (sAgreementId) {
			await this.getModel("AgrService").metadataLoaded();
			this.getView().byId("UploadCollection").getBinding("items").refresh();
			this.getView().bindElement({
				path: "AgrService>/AgreementSet('" + sAgreementId + "')",
				events: {
					change: function (oEvent) {}.bind(this),
					dataReceived: function (oEvent) {}.bind(this)
				}
			})
		},
		onNavBack: function () {
			window.history.go(-1);
		},
		onUpdatePress: function () {
			var Uname = this._Refresh;
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("updateAgreement", {
				AgreementId: this._AgreementId,
				RequestId: this._RequestId,
				Refresh: Uname
			})
		},
		onTemplateClick: function (oEvent) {
			var t = this.getView().getBindingContext("AgrService").getObject().DpoRequest;
			this.getModel("AgrService").read("/WordTemplateLinkSet(DpoRequest='" + t + "')", {
				success: function (oData) {
					window.open(oData.LINK, "_blank").focus()
				}.bind(this)
			})
		},
		onBeforeUploadStarts: function (oEvent) {
			var sRequestId = this.getView().byId("RequestId").getValue();
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var oToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: oEvent.getSource().getModel().getSecurityToken()
			});
			var oSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: encodeURIComponent(oEvent.getParameter("fileName"))
			});
			var oRequest = new sap.m.UploadCollectionParameter({
				name: "DpoRequest",
				value: sRequestId + "-" + this._AgreementId
			});
			oEvent.getParameters().addHeaderParameter(oToken);
			oEvent.getParameters().addHeaderParameter(oSlug);
			oEvent.getParameters().addHeaderParameter(oRequest)
		},
		onUploadComplete: function () {
			var oUploadCollection = this.getView().byId("UploadCollection");
			oUploadCollection.getBinding("items").refresh()
		},
		onFileDeleted: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var sDocId = oEvent.getParameter("documentId");
			this.getView().getModel("AgrService").remove(oEvent.getParameter("item").getBindingContext("AgrService").getPath(), {
				method: "DELETE",
				success: function (oData) {
					var sMsg = "Success.";
					sap.m.MessageToast.show(sMsg);
					var oUploadCollection = this.getView().byId("UploadCollection");
					oUploadCollection.getBinding("items").refresh()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error.";
					sap.m.MessageToast.show(oError);
					this.getView().setBusy(false)
				}
			})
		},
		onNextStepAgreementDialog: function (oEvent) {
			this.ElementBindingView = this.getView().getBindingContext("AgrService").getPath();
			var t = this.getView();
			this._NextStepWriting = Fragment.load({
				id: t.getId(),
				name: "ZHR_DPO_REQUEST.fragment.NextStepAgreement",
				controller: this
			}).then(function (e) {
				t.addDependent(e);
				return e
			});
			this._NextStepWriting.then(function (e) {
				e.setModel(this.getOwnerComponent().getModel("AgrService"));
				e.bindElement(this.ElementBindingView);
				e.open()
			}.bind(this))
		},
		onNextStepConfirmPress: function (oEvent) {
			this.DialogToClose = oEvent.getSource().getParent();
			var sStatus = this.getView().byId("AgreementStatus").getSelectedKey();
			var sClarification = this.getView().byId("Comment").getValue();
			this.getView().getModel("AgrService").callFunction("/NextStep", {
				method: "GET",
				urlParameters: {
					DpoAgreement: this._AgreementId,
					StatusAgreementNext: sStatus,
					Clarification: sClarification,
					actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
						"/Deputy/uname")
				},
				success: function (oData, oResponse) {
					var sMsg = this.getView().getModel("i18n").getProperty("processedSuccessfully");
					sap.m.MessageToast.show(sMsg);
					this.getView().getElementBinding("AgrService").refresh();
					var i = this.getOwnerComponent().getEventBus();
					this.getView().byId("HistoryTable").getBinding("rows").refresh();
					this.DialogToClose.destroy()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onStornoPress: function (oEvent) {
			if (!this.oStornoAgreementDialog) {
				this.oStornoAgreementDialog = new Dialog({
					type: DialogType.Message,
					title: this.getView().getModel("i18n").getProperty("stornoAgreementTitle"),
					content: new Text({
						text: this.getView().getModel("i18n").getProperty("stornoAgreementText")
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getProperty("yes"),
						press: function () {
							this.getView().getModel("AgrService").callFunction("/Storno", {
								method: "GET",
								urlParameters: {
									DpoAgreement: this._AgreementId
								},
								success: function (oData, oResponse) {
									var sMsg = "Storno done successfully.";
									sap.m.MessageToast.show(sMsg)
								}.bind(this),
								error: function (oError) {
									var sMsg = "Error occured in oData import function getSupervisor.";
									sap.m.MessageToast.show(oError)
								}.bind(this)
							});
							this.oStornoAgreementDialog.close()
						}.bind(this)
					}),
					endButton: new Button({
						text: this.getView().getModel("i18n").getProperty("no"),
						press: function () {
							this.oStornoAgreementDialog.close()
						}.bind(this)
					})
				})
			}
			this.oStornoAgreementDialog.open()
		},
		onDeletePress: function (oEvent) {
			if (!this.oDeleteAgreementDialog) {
				this.oDeleteAgreementDialog = new Dialog({
					type: DialogType.Message,
					title: this.getView().getModel("i18n").getProperty("deleteAgreementTitle"),
					content: new Text({
						text: this.getView().getModel("i18n").getProperty("deleteAgreementText")
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getProperty("yes"),
						press: function () {
							this.getView().getModel("AgrService").callFunction("/Delete", {
								method: "GET",
								urlParameters: {
									DpoAgreement: this._AgreementId
								},
								success: function (oData, oResponse) {
									var sMsg = "Delete done successfully.";
									sap.m.MessageToast.show(sMsg)
								}.bind(this),
								error: function (oError) {
									var sMsg = "Error occured in oData import function getSupervisor.";
									sap.m.MessageToast.show(oError)
								}.bind(this)
							});
							this.oDeleteAgreementDialog.close()
						}.bind(this)
					}),
					endButton: new Button({
						text: this.getView().getModel("i18n").getProperty("no"),
						press: function () {
							this.oDeleteAgreementDialog.close()
						}.bind(this)
					})
				})
			}
			this.oDeleteAgreementDialog.open()
		},
		onDataReceivedAgreementHistoryTable: function (oEvent) {
			var Count = oEvent.getSource().getLength();
			if (Count > 10) {
				Count = 10
			} else if (Count > 3) {
				Count = oEvent.getSource().getLength();
			} else {
				Count = 3;
			}
			this.getView().byId("HistoryTable").setVisibleRowCount(Count);
		},
	})
});