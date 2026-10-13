sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller", "sap/ui/model/Filter", "sap/ui/core/Fragment",
	"sap/ui/model/FilterOperator", "sap/m/Dialog", "sap/m/DialogType", "sap/m/Button", "sap/m/ButtonType",
	"sap/m/Text"
], function (BaseController, Filter, Fragment, FilterOperator, Dialog, DialogType, Button, ButtonType, Text) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("updateTerm").attachPatternMatched(this._onPatternMatchedUpdate, this);
			this.Utils = {
				ranking: {
					Initial: 0,
					Default: 1024,
					Before: function (e) {
						return e + 1024
					},
					Between: function (e, t) {
						return (e + t) / 2
					},
					After: function (e) {
						return e / 2
					}
				},
				getAvailableProductsTable: function (e) {
					return e.getOwnerComponent().getRootControl().byId("availableProducts").byId("table")
				},
				getSelectedProductsTable: function (e) {
					return e.getOwnerComponent().getRootControl().byId("selectedProducts").byId("table")
				},
				getSelectedItemContext: function (e, t) {
					var n = e.getSelectedItems();
					var i = n[0];
					if (!i) {
						MessageToast.show("Please select a row!");
						return
					}
					var s = i.getBindingContext();
					if (s && t) {
						var o = e.indexOfItem(i);
						t(s, o, e)
					}
					return s
				}
			}
		},
		_onPatternMatchedUpdate: function (oEvent) {
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
			this._TermId = oArgs.TermId;
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
					this.getView().bindElement({
						path: "TermService>/TermSet('" + this._TermId + "')",
						events: {
							change: function (oEvent) {}.bind(this),
							dataReceived: function (oEvent) {
								this.byId("MainForm").setEditable(false)
							}.bind(this)
						}
					})
				}.bind(this)
			});
		},
		onNavBack: function () {
			this.getView().getElementBinding("TermService").refresh();
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("detailTerm", {
				TermId: this._TermId,
				Refresh: Uname
			})
		},
		onSavePress: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.saveData("TermService").then(function () {
				var i = this.getOwnerComponent().getEventBus();
				i.publish("reloadRequestsMaster");
				i.publish("reloadPointsOfDiscussion");
				this.getView().getModel("TermService").callFunction("/SaveTerm", {
					method: "GET",
					urlParameters: {
						TermId: this._TermId
					},
					success: function (oData) {
						var sMsg = this.getView().getModel("i18n").getProperty("saved");
						sap.m.MessageToast.show(sMsg)
					}.bind(this),
					error: function (oError) {
						var sMsg = "Error.";
						sap.m.MessageToast.show(oError)
					}.bind(this)
				})
			}.bind(this))
		},
		onBeforeUploadStarts: function (oEvent) {
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
				value: this._RequestId
			});
			oEvent.getParameters().addHeaderParameter(oToken);
			oEvent.getParameters().addHeaderParameter(oSlug);
			oEvent.getParameters().addHeaderParameter(oRequest)
		},
		onUploadComplete: function () {
			var oUploadCollection = this.getView().byId("UploadCollection");
			oUploadCollection.getBinding("items").refresh()
		},
		onDeleteTermDialog: function (oEvent) {
			if (!this.oDeleteTermDialog) {
				this.oDeleteTermDialog = new Dialog({
					type: DialogType.Message,
					title: this.getView().getModel("i18n").getProperty("deleteTermTitle"),
					content: new Text({
						text: this.getView().getModel("i18n").getProperty("deleteTermText")
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getProperty("yes"),
						press: function () {
							this.getView().getModel("TermService").callFunction("/DeleteTerm", {
								method: "GET",
								urlParameters: {
									TermId: this._TermId
								},
								success: function (oData, oResponse) {
									var sMsg = this.getView().getModel("i18n").getProperty("termDeleted");
									sap.m.MessageToast.show(sMsg);
									var i = this.getOwnerComponent().getEventBus();
									i.publish("reloadTermsMaster");
									setTimeout(() => {
										sap.ui.getCore().getMessageManager().removeAllMessages();
										this.getRouter().navTo("terms", null, true)
									}, 2e3)
								}.bind(this),
								error: function (oError) {
									var sMsg = "Error occured in oData import function getSupervisor.";
									sap.m.MessageToast.show(oError)
								}.bind(this)
							});
							this.oDeleteTermDialog.close()
						}.bind(this)
					}),
					endButton: new Button({
						text: this.getView().getModel("i18n").getProperty("no"),
						press: function () {
							this.oDeleteTermDialog.close()
						}.bind(this)
					})
				})
			}
			this.oDeleteTermDialog.open()
		},
		onChangeTermStatusDialog: function (oEvent) {
			var oView = this.getView();
			this._pDialog = Fragment.load({
				id: oView.getId(),
				name: "ZHR_DPO_REQUEST.fragment.ChangeTermStatus",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				return oDialog
			});
			this._pDialog.then(function (oDialog) {
				oDialog.open()
			}.bind(this))
		},
		onChangeTermStatusConfirmPress: function (oEvent) {
			this.DialogToClose = oEvent.getSource().getParent();
			var sStatus = this.getView().byId("TermNewStatus").getSelectedKey();
			this.getView().getModel("TermService").callFunction("/NextStep", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					StatusTermNext: sStatus
				},
				success: function (oData, oResponse) {
					var sMsg = this.getView().getModel("i18n").getProperty("statusSuccessfullyChanged");
					sap.m.MessageToast.show(sMsg);
					this.getView().getElementBinding("TermService").refresh();
					var i = this.getOwnerComponent().getEventBus();
					i.publish("reloadRequestsMaster");
					this.DialogToClose.destroy()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			});
			this.DialogToClose.close()
		},
		onChangeTermStatusDialog: function (oEvent) {
			var oView = this.getView();
			this._changeTermDialog = Fragment.load({
				id: oView.getId(),
				name: "ZHR_DPO_REQUEST.fragment.ChangeTermStatus",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				return oDialog
			});
			this._changeTermDialog.then(function (oDialog) {
				oDialog.open()
			}.bind(this))
		},
		onRequestValueHelpPress: function (oEvent) {
			var sValue = oEvent.getSource().getValue(),
				oView = this.getView();
			if (!this._requestValueHelpDialog) {
				this._requestValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_DPO_REQUEST.fragment.RequestValueHelp",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog
				})
			}
			this._requestValueHelpDialog.then(function (oDialog) {
				oDialog.open()
			})
		},
		onRequestValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oView = this.getView();
			this._requestValueHelpDialog.then(function (oDialog) {
				var oFilter = new Filter({
					filters: [new Filter("DpoRequest", FilterOperator.Contains, sValue), new Filter("Name", FilterOperator.Contains, sValue)],
					and: false
				});
				oDialog.getBinding("items").filter(oFilter)
			})
		},
		onValueHelpConfirm: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			this.byId("RequestInput").setValue(oSelectedItem.getTitle())
		},
		onAddRequestTotermDialog: function (oEvent) {
			this.ElementBindingView = this.getView().getBindingContext("TermService").getPath();
			var oView = this.getView();
			if (!this._addRequestToTermDialog) {
				this._addRequestToTermDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_DPO_REQUEST.fragment.AddRequestToTerm",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog
				})
			}
			this._addRequestToTermDialog.then(function (oDialog) {
				oDialog.bindElement(this.ElementBindingView);
				oDialog.open()
			}.bind(this))
		},
		onSortPointsOfDiscussion: function (oEvent) {
			this.ElementBindingView = this.getView().getBindingContext("TermService").getPath();
			var oView = this.getView();
			if (!this._sortPointsOfDiscussion) {
				this._sortPointsOfDiscussion = Fragment.load({
					id: oView.getId(),
					name: "ZHR_DPO_REQUEST.fragment.SortPointsOfDiscussion",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog
				})
			}
			this._sortPointsOfDiscussion.then(function (oDialog) {
				oDialog.bindElement(this.ElementBindingView);
				oDialog.open()
			}.bind(this))
		},
		onAddRequestToTermDialogSuccess: function (oEvent) {
			var sDpoRequest = this.byId("RequestInput").getValue();
			this.DialogToClose = oEvent.getSource().getParent();
			this.getView().getModel("TermService").callFunction("/AddRequestToTerm", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					DpoRequest: sDpoRequest
				},
				success: function (oData, oResponse) {
					var sMsg = "success";
					sap.m.MessageToast.show(sMsg);
					this.DialogToClose.close();
					this.getView().byId("PointsOfDiscusion").getBinding().refresh()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		}
	})
});