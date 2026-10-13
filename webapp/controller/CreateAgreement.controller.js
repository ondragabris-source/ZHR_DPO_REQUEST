sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller", "sap/ui/core/Fragment",
	"sap/m/Dialog", "sap/m/DialogType", "sap/m/Button", "sap/m/ButtonType",
	"sap/m/Text"
], function (BaseController, Fragment, Dialog, DialogType, Button, ButtonType, Text) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("updateAgreement").attachPatternMatched(this._onPatternMatchedUpdate, this);
			this._oRouter.getRoute("createAgreement").attachPatternMatched(this._onPatternMatchedCreate, this)
		},
		_notCreatedAgreement: function () {
			this.getView().byId("DeleteButton").setVisible(true);
			this.getView().byId("NavBackButton").setVisible(false);
		},
		_createdAgreement: function () {
			this.getView().byId("DeleteButton").setVisible(false);
			this.getView().byId("NavBackButton").setVisible(true);
		},
		_onPatternMatchedUpdate: function (oEvent) {
			this._createdAgreement();
			this._Created = 1;
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
			this._AgreementId = oArgs.AgreementId;
			this._RequestId = oArgs.RequestId;
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
					this._bindElement(this._AgreementId);
				}.bind(this)
			});
		},
		_onPatternMatchedCreate: function (oEvent) {
			this._notCreatedAgreement();
			this._Created = 0;
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
			this._RequestId = oArgs.RequestId;
			this._AgreementId = oArgs.AgreementId;
			this._Refresh = this.b64_to_utf8(oArgs.Refresh);
			this._bindElement(this._AgreementId);
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
				}.bind(this)
			});
		},
		_bindElement: async function (sAgreementId) {
			await this.getModel("AgrService").metadataLoaded();
			this.getView().bindElement({
				path: "AgrService>/AgreementSet('" + sAgreementId + "')",
				events: {
					change: function (oEvent) {}.bind(this),
					dataReceived: function (oEvent) {}.bind(this)
				}
			})
		},
		onCreatePress: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.saveData("AgrService").then(function () {
				this._Refresh = this.utf8_to_b64(this._Refresh);
				window.history.go(-1);
			}.bind(this))
		},
		onTemplateClick: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.saveData("AgrService").then(function () {
				var sDpoRequest = this.getView().getBindingContext("AgrService").getObject().DpoRequest;

				this.getModel("AgrService").read("/WordTemplateLinkSet(DpoRequest='" + sDpoRequest + "')", {
					success: function (oData) {
						window.open(oData.LINK, "_blank").focus()
					}.bind(this)
				})
				var sMsg = this.getModel("i18n").getProperty("saved");
				sap.m.MessageToast.show(sMsg);
			}.bind(this))
		},
		onNextStepAgreementDialog: function (oEvent) {
			this.ElementBindingView = this.getView().getBindingContext("AgrService").getPath();
			var oView = this.getView();
			this._NextStepWriting = Fragment.load({
				id: oView.getId(),
				name: "ZHR_DPO_REQUEST.fragment.NextStepAgreement",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				return oDialog
			});
			this._NextStepWriting.then(function (oDialog) {
				oDialog.setModel(this.getOwnerComponent().getModel("AgrService"));
				oDialog.bindElement(this.ElementBindingView);
				oDialog.open()
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
					var oEventBus = this.getOwnerComponent().getEventBus();
					oEventBus.publish("reloadAgreementMaster");
					oEventBus.publish("reloadAgreementTableOnRequest");
					this.DialogToClose.destroy()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onSavePress: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.saveData("AgrService").then(function () {
				this._Refresh = this.utf8_to_b64(this._Refresh);
				window.history.go(-1);
				var sMsg = this.getModel("i18n").getProperty("saved");
				sap.m.MessageToast.show(sMsg);
			}.bind(this))
		},

		onNavBack: function () {
			window.history.go(-1)
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
									var sMsg = "Dohoda byla úspìšnì smazána.";
									sap.m.MessageToast.show(sMsg);
									window.history.go(-2);
								}.bind(this),
								error: function (oError) {
									var sMsg = "Došlo k chybì.";
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
		onBeforeUploadStarts: function (oEvent) {
			var sRequestId = this._RequestId;
			sap.ui.getCore().getMessageManager().removeAllMessages();
			for (var i = 0; i < this.getView().byId("UploadCollection").getItems().length; i++) {
					var pom="Dohoda mùže mít pouze jednu pøílohu.";
					sap.m.MessageBox.error(pom);
					this.getView().byId("UploadCollection").fireUploadTerminated();
					return;
			}
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
		}
	})
});