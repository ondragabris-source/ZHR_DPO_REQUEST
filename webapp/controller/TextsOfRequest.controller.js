sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller", "sap/ui/core/Fragment"], function (BaseController, Fragment) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("textsOfRequest").attachPatternMatched(this._onPatternMatchedTextsOfRequest, this)
		},
		_onPatternMatchedTextsOfRequest: function (e) {
			var t = e.getParameter("arguments");
			this._RequestId = t.RequestId;
			this._Refresh = this.b64_to_utf8(t.Refresh);
			this.getView().unbindElement();
			this.getModel().read("/CreatorSet", {
				success: function (e) {
					var t = {
						uname: '',
						fullname: ''
					};
					for (var i = 0; i < e.results.length; i++) {
						if (e.results[i].CreatorUname == this._Refresh) {
							t = {
								uname: e.results[i].CreatorUname ,
								fullname: e.results[i].CreatorFullName 
							};
							break;
						}
					}
					this.getModel("appModel").setProperty("/Deputy", t);
				}.bind(this)
			});
			this.getView().bindElement({
				path: "/LongTextAllSet('" + this._RequestId + "')",
				events: {
					change: function (e) {}.bind(this),
					dataReceived: function (e) {}.bind(this)
				}
			})
		},
		onPdfPress: function (e) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getView().getModel().callFunction("/PDFForm", {
				method: "GET",
				urlParameters: {
					RequestID: this._RequestId
				},
				success: function (e, t) {
					sap.m.MessageToast.show("Success")
				}.bind(this),
				error: function (e) {
					sap.m.MessageToast.show(e)
				}.bind(this)
			})
		},
		onNextStepPress: function (e) {
			this.ChangeDeputyBindingPath = e.getSource().getParent().getParent().getBindingContext().getPath();
			this.ChangeDeputyBindingPath = this.ChangeDeputyBindingPath.replace("LongTextAllSet", "RequestDataSet");
			var t = this.getView();
			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: t.getId(),
					name: "ZHR_DPO_REQUEST.fragment.NextStepRequest",
					controller: this
				}).then(function (e) {
					t.addDependent(e);
					return e
				})
			}
			this._pDialog.then(function (e) {
				this.getView().byId("NextStepSelect");
				e.bindElement(this.ChangeDeputyBindingPath);
				e.open()
			}.bind(this))
		},
		onNextStepConfirmPress: function (e) {
			var t = this.getView().byId("NextStepSelect").getSelectedKey();
			var s = this.getView().byId("Clarification").getValue();
			this.DialogToClose = e.getSource().getParent();
			this.getView().getModel().callFunction("/NextStep", {
				method: "GET",
				urlParameters: {
					RequestID: this._RequestId,
					NextStatus: t,
					Clarification: s
				},
				success: function (e, t) {
					var s = "next step success.";
					sap.m.MessageToast.show(s);
					this.DialogToClose.close();
					this.navBackToMaster()
				}.bind(this),
				error: function (e) {
					var t = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(e)
				}.bind(this)
			})
		},
		onInternalPdfPress: function (e) {
			var t = document.createElement("a");
			t.href = "/sap/opu/odata/sap/ZHR_DPO_REQUEST01_SRV/ShowPdfSet(DpoRequest='" + this._RequestId + "',FormType='INT')/$value";
			t.download = this._RequestId + "-internal.pdf";
			t.dispatchEvent(new MouseEvent("click"))
		},
		onExternalPdfPress: function (e) {
			var t = document.createElement("a");
			t.href = "/sap/opu/odata/sap/ZHR_DPO_REQUEST01_SRV/ShowPdfSet(DpoRequest='" + this._RequestId + "',FormType='EXT')/$value";
			t.download = this._RequestId + "-external.pdf";
			t.dispatchEvent(new MouseEvent("click"))
		},
		onSavePress: function (e) {
			this.saveData().then(function(){
				var n = this.getView().getModel("i18n").getProperty("saved");
				sap.m.MessageToast.show(n);
			}.bind(this));
		},
		onWerksChange: function (e) {
			this.getView().byId("WerksLongText").setValue(e.getSource().getSelectedItem().getProperty("additionalText"))
		},
		onNavBack: function () {
			var e = sap.ui.core.UIComponent.getRouterFor(this);
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			var oRouter = this.getOwnerComponent().getRouter(); 
			if(Uname == '' || Uname == null || Uname == "SELF"){
				Uname = this.utf8_to_b64('SELF')
			}else{
				Uname= this.utf8_to_b64(Uname);
			}
			oRouter.navTo("detail", {
				RequestId: this._RequestId,
				Refresh: Uname
			}, true);
			this.getView().getBindingContext().getModel().resetChanges()
		}
	})
});