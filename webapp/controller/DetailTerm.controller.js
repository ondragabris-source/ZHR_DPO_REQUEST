sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller", "sap/ui/model/Filter", "sap/ui/core/Fragment",
	"sap/ui/model/FilterOperator", "sap/m/Dialog", "sap/m/DialogType", "sap/m/Button", "sap/m/ButtonType",
	"sap/m/Text"
], function (BaseController, Filter, Fragment, FilterOperator, Dialog, DialogType, Button, ButtonType, Text) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("detailTerm").attachPatternMatched(this._onPatternMatchedDetail, this);
			window.D = this;
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.subscribe("reloadPointsOfDiscussion", this.reloadPointsOfDiscussion, this);
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
					var i = e.getSelectedItems();
					var n = i[0];
					if (!n) {
						return
					}
					var r = n.getBindingContext();
					if (r && t) {
						var s = e.indexOfItem(n);
						t(r, s, e)
					}
					return r
				}
			}
		},
		_onPatternMatchedDetail: function (oEvent) {
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
			this._TermId = oArgs.TermId;
			this._Refresh = this.b64_to_utf8(oArgs.Refresh);
			var oModel = this.getOwnerComponent().getModel();

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
							dataReceived: function (oEvent) {}.bind(this)
						}
					});
					this.getView().byId("PointsOfDiscusion").getBinding().refresh();
				}.bind(this)
			});
		},
		onEditPress: function (oEvent) {
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if(Uname == '' || Uname == null || Uname == "SELF"){
				Uname = this.utf8_to_b64('SELF')
			}else{
				Uname= this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("updateTerm", {
				TermId: this._TermId,
				Refresh: Uname
			})
		},
		reloadPointsOfDiscussion: function (oEvent) {
			var oTable = this.getView().byId("PointsOfDiscusion");
			oTable.getBinding("rows").refresh(true);
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.publish("reloadRequestsMaster")
		},
		onNavBack: function () {
			var e = sap.ui.core.UIComponent.getRouterFor(this);
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if(Uname == '' || Uname == null || Uname == "SELF"){
				Uname = this.utf8_to_b64('SELF')
			}else{
				Uname= this.utf8_to_b64(Uname);
			}
			e.navTo("terms", {
				Refresh: Uname
			})
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.publish("reloadTermsMaster")
		},
		onSavePress: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.saveData("TermService").then(function () {
				this.getView().getModel("TermService").callFunction("/SaveTerm", {
					method: "GET",
					urlParameters: {
						TermId: this._TermId
					},
					success: function (oData) {
						var sMsg = "Success SaveTerm.";
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
		onMultiChangeStatusDialog: function (oEvent) {
			if (!this.oMultiChangeStatusDialog) {
				this.oMultiChangeStatusDialog = new Dialog({
					type: DialogType.Message,
					title: this.getView().getModel("i18n").getProperty("multipleChangeRequestStatusTitle"),
					content: new Text({
						text: this.getView().getModel("i18n").getProperty("multipleChangeRequestStatusText")
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getProperty("yes"),
						press: function (oEvent) {
							this.DialogToClose = oEvent.getSource().getParent();
							this.multiChangeStatus()
						}.bind(this)
					}),
					endButton: new Button({
						text: this.getView().getModel("i18n").getProperty("no"),
						press: function () {
							this.oMultiChangeStatusDialog.close()
						}.bind(this)
					})
				})
			}
			this.oMultiChangeStatusDialog.open()
		},
		onChangeTermStatusConfirmPress: function (oEvent) {
			this.DialogToClose = oEvent.getSource().getParent();
			var sStatus = this.getView().byId("TermNewStatus").getSelectedKey();
			this.DialogToClose = oEvent.getSource().getParent();
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if(Uname == '' || Uname == null || Uname == "SELF"){
				Uname = this.utf8_to_b64('SELF')
			}else{
				Uname= this.utf8_to_b64(Uname);
			}
			this.getView().getModel("TermService").callFunction("/NextStep", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					StatusTermNext: sStatus,
					actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
						"/Deputy/uname")
				},
				success: function (oData, oResponse) {
					var sMsg = this.getView().getModel("i18n").getProperty("statusSuccessfullyChanged");
					sap.m.MessageToast.show(sMsg);
					this.getView().getElementBinding("TermService").refresh();
					this.getView().byId("PointsOfDiscusion").getBinding().refresh();
					var oEventBus = this.getOwnerComponent().getEventBus();
					oEventBus.publish("reloadRequestsMaster");
					this.DialogToClose.destroy()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			});
			this.DialogToClose.close()
		},
		onSortingSuccess: function (oEvent) {
			oEvent.getSource().getParent().close();
			var oModel = this.getOwnerComponent().getModel("TermService");
			var oDeferred = $.Deferred();
			if (!oModel) {
				return false
			}
			if (!oModel.hasPendingChanges()) {
				oDeferred.resolve()
			} else {
				oModel.submitChanges({
					success: function (oData, oResponse) {
						oDeferred.resolve(oData)
					},
					error: function () {
						oDeferred.reject()
					}
				});
				oDeferred.always(function () {
					sap.ui.core.BusyIndicator.hide();
					this.reloadPointsOfDiscussion()
				}.bind(this))
			}
		},
		onCloseDialogResetChanges: function (oEvent) {
			oEvent.getSource().getParent().close();
			this.getView().getModel("TermService").resetChanges();
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
				if (this.getModel("appModel").getProperty("/Deputy/uname") != undefined) {
					oDialog.getBinding("items").filter([new Filter("Creator", FilterOperator.Contains, this.getModel("appModel").getProperty("/Deputy/uname")), new Filter(
						"Process", FilterOperator.Contains, "P-CENTR")])
				} else {
					oDialog.getBinding("items").filter([new Filter("Process", FilterOperator.Contains, "P-CENTR")])
				}
				oDialog.open()
			}.bind(this))
		},
		onRequestValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oView = this.getView();
			this._requestValueHelpDialog.then(function (oDialog) {
				var oFilter;
				if (this.getModel("appModel").getProperty("/Deputy/uname") != undefined) {
					oFilter = new Filter({
						filters: [new Filter("RequestorNameFull", FilterOperator.Contains, sValue), new Filter("DpoReqFull", FilterOperator.Contains, sValue), new Filter("Name", FilterOperator.Contains, sValue), new Filter(
							"Orgeh", FilterOperator.Contains, sValue), new Filter("ProcessDesc", FilterOperator.Contains, sValue), new Filter("Process", FilterOperator.Contains, "P-CENTR"), new Filter("Creator", FilterOperator
							.Contains, this.getModel("appModel").getProperty("/Deputy/uname"))],
						and: false
					})
				} else {
					oFilter = new Filter({
						filters: [new Filter("RequestorNameFull", FilterOperator.Contains, sValue), new Filter("DpoReqFull", FilterOperator.Contains, sValue), new Filter("Name", FilterOperator.Contains, sValue), new Filter(
							"Orgeh", FilterOperator.Contains, sValue), new Filter("Process", FilterOperator.Contains, "P-CENTR"), new Filter("ProcessDesc", FilterOperator.Contains, sValue)],
						and: false
					})
				}
				oDialog.getBinding("items").filter(oFilter)
			}.bind(this))
		},
		onValueHelpConfirm: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			this.byId("RequestInput").setValue(oSelectedItem.getTitle());
			this._SelectedDpoRequest = oSelectedItem.getBindingContext().getObject().DpoRequest;
			this.getView().byId("AddToTermButton").setEnabled(true)
		},
		onAddRequestTotermDialog: function (oEvent) {
			this.ElementBindingView = this.getView().getBindingContext("TermService").getPath();
			var oView = this.getView();
			this._addRequestToTermDialog = Fragment.load({
				id: oView.getId(),
				name: "ZHR_DPO_REQUEST.fragment.AddRequestToTerm",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				return oDialog
			});
			this._addRequestToTermDialog.then(function (oDialog) {
				oDialog.bindElement(this.ElementBindingView);
				oDialog.open()
			}.bind(this))
		},
		onAddWritingToRequest: function (oEvent) {
			var iIndex = this.getView().byId("PointsOfDiscusion").getSelectedIndices()[0];
			var sDpoRequest = this.getModel("TermService").getData(this.getView().byId("PointsOfDiscusion").getContextByIndex(iIndex).getPath()).DpoRequest;
			sDpoRequest = sDpoRequest.split("/")[0];
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if(Uname == '' || Uname == null || Uname == "SELF"){
				Uname = this.utf8_to_b64('SELF')
			}else{
				Uname= this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("writingFromTerm", {
				RequestId: sDpoRequest,
				Refresh: Uname
			})
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
			} else{
				this.onForceSort();
			}
			this._sortPointsOfDiscussion.then(function (oDialog) {
				this.getView().getModel("TermService").resetChanges();
				oDialog.bindElement(this.ElementBindingView);
				oDialog.open()
			}.bind(this))
		},
		onAddRequestToTermDialogSuccess: function (oEvent) {
			var sDpoRequest = this._SelectedDpoRequest;
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
					this.DialogToClose.destroy();
					this.getView().byId("PointsOfDiscusion").getBinding().refresh();
					var oEventBus = this.getOwnerComponent().getEventBus();
					oEventBus.publish("reloadRequestsMaster")
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onDeleteRequestTotermDialog: function (oEvent) {
			if (this.getView().byId("PointsOfDiscusion").getSelectedIndices().length < 1) {
				return
			}
			if (!this.oDeleteRequestTotermDialog) {
				this.oDeleteRequestTotermDialog = new Dialog({
					type: DialogType.Message,
					title: this.getView().getModel("i18n").getProperty("removePointOfDiscussionTitle"),
					content: new Text({
						text: this.getView().getModel("i18n").getProperty("removePointOfDiscussionText")
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getProperty("yes"),
						press: function (oEvent) {
							this.DialogToClose = oEvent.getSource().getParent();
							var iIndex = this.getView().byId("PointsOfDiscusion").getSelectedIndices()[0];
							var sDpoRequest = this.getModel("TermService").getData(this.getView().byId("PointsOfDiscusion").getContextByIndex(iIndex).getPath()).DpoRequest;
							this.deleteRequestFromTerm(sDpoRequest);
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
			this.oDeleteRequestTotermDialog.open()
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
									var oEventBus = this.getOwnerComponent().getEventBus();
									this.getView().getElementBinding("TermService").refresh(true);
									oEventBus.publish("reloadRequestsMaster");
									setTimeout(() => {
										sap.ui.getCore().getMessageManager().removeAllMessages();
										this.onNavBack()
									}, 2e3);
									this.oDeleteTermDialog.close()
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
		deleteRequestFromTerm: function (sDpoRequest) {
			this.getView().getModel("TermService").callFunction("/RemoveRequestFromTerm", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					DpoRequest: sDpoRequest
				},
				success: function (oData, oResponse) {
					var sMsg = this.getView().getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(sMsg);
					this.DialogToClose.close();
					this.getView().byId("PointsOfDiscusion").getBinding().refresh();
					var oEventBus = this.getOwnerComponent().getEventBus();
					oEventBus.publish("reloadRequestsMaster")
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		multiChangeStatus: function (oData) {
			this.getView().getModel("TermService").callFunction("/MultiChangeStatus", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					OrigUser: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
						"/Deputy/uname")
				},
				success: function (oData, oResponse) {
					var sMsg = this.getView().getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(sMsg);
					this.getView().byId("PointsOfDiscusion").getBinding().refresh();
					var oEventBus = this.getOwnerComponent().getEventBus();
					oEventBus.publish("reloadRequestsMaster");
					this.oMultiChangeStatusDialog.close()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function multiChangeStatus.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onDropSelectedProductsTable: function (oEvent) {
			var oDraggedControl = oEvent.getParameter("draggedControl");
			var oDroppedControl = oEvent.getParameter("droppedControl");
			if (oDroppedControl instanceof sap.m.ColumnListItem) {
				var sDropPosition = oEvent.getParameter("dropPosition");
				var oParent = oDroppedControl.getParent();
				var iDropIndex = oParent.indexOfItem(oDroppedControl);
				var iNewIndex = iDropIndex + (sDropPosition === "After" ? 1 : -1);
				var oNewItem = oParent.getItems()[iNewIndex];
				if (!oNewItem) {
					var iDragIndex = oParent.getItems().indexOf(oEvent.getParameter("draggedControl"));
					this.sortPointsOfDiscusion(iDragIndex, iDropIndex, oParent)
				} else {
					var iDragIndex = oParent.getItems().indexOf(oEvent.getParameter("draggedControl"));
					this.sortPointsOfDiscusion(iDragIndex, iDropIndex, oParent)
				}
			}
			this.recalculateOrderNumbersPointfOfDiscussions();
			this.recalculateTimesPointsOfDiscusions()
		},
		sortPointsOfDiscusion: function (iDragIndex, iDropIndex, oTable) {
			if (iDragIndex > iDropIndex) {
				for (var n = iDragIndex; n > iDropIndex; n--) {
					var sPath = oTable.getItems()[n].getBindingContext("TermService").sPath;
					var sDeepPath = oTable.getItems()[n].getBindingContext("TermService").sDeepPath;
					oTable.getItems()[n].getBindingContext("TermService").sPath = oTable.getItems()[n - 1].getBindingContext("TermService").sPath;
					oTable.getItems()[n].getBindingContext("TermService").sDeepPath = oTable.getItems()[n - 1].getBindingContext("TermService").sDeepPath;
					oTable.getItems()[n - 1].getBindingContext("TermService").sPath = sPath;
					oTable.getItems()[n - 1].getBindingContext("TermService").sDeepPath = sDeepPath
				}
			} else {
				for (var n = iDragIndex; n < iDropIndex; n++) {
					var sPath = oTable.getItems()[n].getBindingContext("TermService").sPath;
					var sDeepPath = oTable.getItems()[n].getBindingContext("TermService").sDeepPath;
					oTable.getItems()[n].getBindingContext("TermService").sPath = oTable.getItems()[n + 1].getBindingContext("TermService").sPath;
					oTable.getItems()[n].getBindingContext("TermService").sDeepPath = oTable.getItems()[n + 1].getBindingContext("TermService").sDeepPath;
					oTable.getItems()[n + 1].getBindingContext("TermService").sPath = sPath;
					oTable.getItems()[n + 1].getBindingContext("TermService").sDeepPath = sDeepPath
				}
			}
		},
		recalculateOrderNumbersPointfOfDiscussions: function (oEvent) {
			var sOrderNr = "";
			var oTable = this.getView().byId("SortPointsOfDiscussionTable");
			for (var n = 0; n < oTable.getItems().length; n++) {
				oTable.getModel("TermService").setProperty("Ordernr", (n+1).toString(), oTable.getItems()[n].getBindingContext("TermService"))
			}
		},
		recalculateTimesPointsOfDiscusions: function (oEvent) {
			var oTable = this.getView().byId("SortPointsOfDiscussionTable");
			var aTime = this.getView().byId("TermTime").getText().split(":");
			var iHours = Number(aTime[0]);
			var iMinutes = Number(aTime[1]);
			for (var s = 0; s < oTable.getItems().length; s++) {
				var oTime = {
					ms: Number(iHours) * 60 * 60 * 1e3 + Number(iMinutes) * 60 * 1e3
				};
				oTable.getModel("TermService").setProperty("ReqTime", oTime, oTable.getItems()[s].getBindingContext("TermService"));
				iMinutes = iMinutes + Number(oTable.getItems()[s].getBindingContext("TermService").getProperty("Duration"));
				if (iMinutes > 59) {
					iMinutes = iMinutes - 60;
					iHours++
				}
			}
		},
		onBeforeOpenContextMenu: function (oEvent) {
			oEvent.getParameters().listItem.setSelected(true)
		},
		onTestGetRecipients: function (oEvent) {
			var sStatus = this.getView().byId("TermStatus").getText();
			this.getView().getModel("TermService").callFunction("/GetMailContacts", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					StatusTerm: sStatus
				},
				success: function (oData, oResponse) {
					this.onEmailPressTest(oData)
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onEmailPressProposal: function (oEvent) {
			var sStatus = this.getView().byId("TermStatus").getText();
			this.getView().getModel("TermService").callFunction("/GetMailContacts", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					StatusTerm: sStatus,
					button_press: "Proposal"
				},
				success: function (oData, oResponse) {
					this.generateAndSendEmailProposal(oData)
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onEmailPressFinal: function (oEvent) {
			var sStatus = this.getView().byId("TermStatus").getText();
			this.getView().getModel("TermService").callFunction("/GetMailContacts", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					StatusTerm: sStatus,
					button_press: "Final"
				},
				success: function (oData, oResponse) {
					this.generateAndSendEmailFinal(oData)
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onEmailPressOdbory: function (oEvent) {
			var sStatus = this.getView().byId("TermStatus").getText();
			this.getView().getModel("TermService").callFunction("/GetMailContacts", {
				method: "GET",
				urlParameters: {
					TermId: this._TermId,
					StatusTerm: sStatus,
					button_press: "Union"
				},
				success: function (oData, oResponse) {
					this.getView().getModel("TermService").callFunction("/GetEmailHeaderAndFooter", {
						method: "GET",
						success: function (oData2, oResponse2) {
							this.generateAndSendEmailOdbory(oData, oData2)
						}.bind(this),
						error: function (oError) {
							var sMsg = "Error occured in oData import function getSupervisor.";
							sap.m.MessageToast.show(oError)
						}.bind(this)
					})
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		generateAndSendEmailOdbory: function (oData, oData2) {
			this.getView().getModel("TermService").read(this.getView().byId("PointsOfDiscusion").getBinding("rows").sDeepPath, {
				success: function (oResponse) {
					var sUrl = "https://" + window.location.host + "/sap/bc/ui2/FLP?sap-client=010#zhr_dpo_request-display&/detail/";
					var aResults = oResponse.results;
					var sTo = "To:" + oData.Mails + "\n";
					var sSubject = "Subject: Seznam žádostí k projednání s odbory " + this.getView().byId("TermDate").getText() +
						"\nX-Unsent: 1\nContent-Type: text/html; charset=utf-8\n\n<html>\n<head><style>body{font-family: Arial;font-size: 13px;}, html, table {font-family: Arial;}table, th, td {border: 1px solid black;}thead {text-align: center;font-size: 1.2em;color: navy;background-color: silver;font-weight: bold;}tbody td {text-align: center;}</style></head>";
					var sBody = "<body>\n" + oData2.HeaderText + "<br><br><br>";
					var sFooter = "<br><br><br>" + oData2.FooterText + "</body>\n</html>";
					var sTable = "<br><br><table style='width:100%;border: 1px solid black'>";
					sTable += "<tr><th>ID žádosti</th><th>Téma projednání</th><th>Detail</th></tr>";
					for (var d = 0; d < aResults.length; d++) {
						if (aResults[d].StatusDescr != "Schváleno Vedoucím SP") continue;
						sTable += "<tr><td>" + aResults[d].DpoReqFull + "</td><td>" + aResults[d].RequestName +
							"</td><td>" + '<a href="' + sUrl + aResults[d].DpoRequest + '/U0VMRg==' + '  ">Detail</a>' + "</td></tr>"
					}
					sTable += "</table>";
					var sContent = sTo + sSubject + sBody + sTable + sFooter;
					var sBlobUrl = null,
						fnCreateUrl = function (sData) {
							var oBlob = new Blob([sData], {
								type: "text/plain"
							});
							if (sBlobUrl !== null) {
								window.URL.revokeObjectURL(sBlobUrl)
							}
							sBlobUrl = window.URL.createObjectURL(oBlob);
							return sBlobUrl
						};
					var oLink = document.createElement("a");
					oLink.href = fnCreateUrl(sContent);
					oLink.style.display = "none";
					oLink.download = "message.eml";
					oLink.dispatchEvent(new MouseEvent("click"))
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		generateAndSendEmailProposal: function (oData) {
			this.getView().getModel("TermService").read(this.getView().byId("PointsOfDiscusion").getBinding("rows").sDeepPath, {
				success: function (oResponse) {
					var aResults = oResponse.results;
					var sTo = "To:" + oData.Mails + "\n";
					var sSubject = "Subject: Návrh programu projednání " + this.getView().byId("TermDate").getText() +
						"\nX-Unsent: 1\nContent-Type: text/html; charset=utf-8\n\n<html>\n<head><style>body{font-family: Arial;font-size: 13px;}, html, table {font-family: Arial;}table, th, td {border: 1px solid black;}thead {text-align: center;font-size: 1.2em;color: navy;background-color: silver;font-weight: bold;}tbody td {text-align: center;}</style></head>";
					var sBody = "<body>\n" + this.getView().byId("ProposalText").getValue().replaceAll("\n", "<br>") + "<br><br><br>";
					var sFooter = "</body>\n</html>";
					var sTable = "<br><br><table style='width:100%;border: 1px solid black'>";
					sTable += "<tr><th>ID žádosti</th><th>Téma projednání</th><th>Čas projednání</th></tr>";
					for (var l = 0; l < aResults.length; l++) {
						if (aResults[l].DpoReqFull == "") break;
						sTable += "<tr><td>" + aResults[l].DpoReqFull + "</td><td>" + aResults[l].RequestName + "</td><td>" + (aResults[l].Ordernr == "999" ? "Elektronicky" : this.formateTimeToString(aResults[l].ReqTime)) +
							"</td></tr>"
					}
					sTable += "</table>";
					var sContent = sTo + sSubject + sBody + sTable + sFooter;
					var sBlobUrl = null,
						fnCreateUrl = function (sData) {
							var oBlob = new Blob([sData], {
								type: "text/plain"
							});
							if (sBlobUrl !== null) {
								window.URL.revokeObjectURL(sBlobUrl)
							}
							sBlobUrl = window.URL.createObjectURL(oBlob);
							return sBlobUrl
						};
					var oLink = document.createElement("a");
					oLink.href = fnCreateUrl(sContent);
					oLink.style.display = "none";
					oLink.download = "message.eml";
					oLink.dispatchEvent(new MouseEvent("click"))
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		generateAndSendEmailFinal: function (oData) {
			this.getView().getModel("TermService").read(this.getView().byId("PointsOfDiscusion").getBinding("rows").sDeepPath, {
				success: function (oResponse) {
					var aResults = oResponse.results;
					var sTo = "To:" + oData.Mails + "\n";
					var sSubject = "Subject: Finální program projednání " + this.getView().byId("TermDate").getText() +
						"\nX-Unsent: 1\nContent-Type: text/html; charset=utf-8\n\n<html>\n<head><style>body{font-family: Arial;font-size: 13px;}, html, table {font-family: Arial;}table, th, td {border: 1px solid black;}thead {text-align: center;font-size: 1.2em;color: navy;background-color: silver;font-weight: bold;}tbody td {text-align: center;}</style></head>";
					var sBody = "<body>\n" + this.getView().byId("FinalText").getValue().replaceAll("\n", "<br>") + "<br><br><br>";
					var sFooter = "</body>\n</html>";
					var sTable = "<br><br><table style='width:100%;border: 1px solid black'>";
					sTable += "<tr><th>ID žádosti</th><th>Téma projednání</th><th>Čas projednání</th></tr>";
					for (var l = 0; l < aResults.length; l++) {
						if (aResults[l].DpoReqFull == "") break;
						sTable += "<tr><td>" + aResults[l].DpoReqFull + "</td><td>" + aResults[l].RequestName + "</td><td>" + (aResults[l].Ordernr == "999" ? "Elektronicky" : this.formateTimeToString(aResults[l].ReqTime)) +
							"</td></tr>"
					}
					sTable += "</table>";
					var sContent = sTo + sSubject + sBody + sTable + sFooter;
					var sBlobUrl = null,
						fnCreateUrl = function (sData) {
							var oBlob = new Blob([sData], {
								type: "text/plain"
							});
							if (sBlobUrl !== null) {
								window.URL.revokeObjectURL(sBlobUrl)
							}
							sBlobUrl = window.URL.createObjectURL(oBlob);
							return sBlobUrl
						};
					var oLink = document.createElement("a");
					oLink.href = fnCreateUrl(sContent);
					oLink.style.display = "none";
					oLink.download = "message.eml";
					oLink.dispatchEvent(new MouseEvent("click"))
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		formateTimeToString: function (oTime) {
			function fnPad(iNum, iSize) {
				iSize = iSize || 2;
				return ("00" + iNum).slice(-iSize)
			}
			var iMs = oTime;
			if (oTime && oTime.ms) {
				iMs = oTime.ms
			}
			var i = iMs % 1e3;
			iMs = (iMs - i) / 1e3;
			var n = iMs % 60;
			iMs = (iMs - n) / 60;
			var r = iMs % 60;
			var s = (iMs - r) / 60;
			return fnPad(s) + ":" + fnPad(r)
		},
		onForceSort: function () {
			var Table = this.getView().byId("SortPointsOfDiscussionTable");

			for (var i = 0; i < Table.getItems().length; i++) {
				var sPath = Table.getItems()[i].getBindingContext("TermService").sPath;
				var sDeepPath = Table.getItems()[i].getBindingContext("TermService").sDeepPath;
				var Index = parseInt(this.getModel("TermService").getData(sPath).Ordernr);
				if(Index == i+1 || Index==999){
					continue;
				}
				Table.getItems()[i].getBindingContext("TermService").sPath = Table.getItems()[Index-1].getBindingContext("TermService").sPath;
				Table.getItems()[i].getBindingContext("TermService").sDeepPath = Table.getItems()[Index-1].getBindingContext("TermService").sDeepPath;
				Table.getItems()[Index-1].getBindingContext("TermService").sPath = sPath;
				Table.getItems()[Index-1].getBindingContext("TermService").sDeepPath = sDeepPath
			}
		},
	})
});