sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller", "sap/ui/model/Filter", "sap/ui/core/Fragment", "sap/m/Dialog",
	"sap/m/DialogType", "sap/m/Button", "sap/m/ButtonType", "sap/m/Text", "sap/ui/table/RowAction", "sap/ui/table/RowActionItem", "sap/ui/core/format/DateFormat"
], function (BaseController, Filter, Fragment, Dialog, DialogType, Button, ButtonType, Text, RowAction, RowActionItem, DateFormat) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("detail").attachPatternMatched(this._onPatternMatchedDetail, this);
			this._oRouter.getRoute("detailfromtasks").attachPatternMatched(this._onPatternMatchedDetailFromTasks, this);
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.subscribe("reloadRequestDetail", this.reloadRequestDetail, this);
			this.DialogToClose = "";
			this.testingPurpose();
			this.oItemTemplate = new sap.m.UploadCollectionItem({
				documentId: "{DocId}",
				fileName: "{Filename}",
				mimeType: "Mimetype",
				url: "{Link}",
				enableEdit: false,
				enableDelete: false,
				visibleDelete: false,
				visibleEdit: false
			});
			oEventBus.subscribe("reloadAgreementTableOnRequest", this.reloadAgreementTableOnRequest, this)
		},
		reloadRequestDetail: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getView().getElementBinding().refresh()
		},
		testingPurpose: function () {
			var fnPress = this.onNavigateToDetailAgreementPress.bind(this);
			var sKey = "Navigation";
			this.modes = [{
				key: "Navigation",
				text: "Navigation",
				handler: function () {
					var oTemplate = new RowAction({
						items: [new RowActionItem({
							type: "Navigation",
							press: fnPress,
							visible: "{Available}"
						})]
					});
					return [1, oTemplate]
				}
			}];
			var oTable = this.byId("AgreementTable");
			var iCount = 0;
			var oTemplate = oTable.getRowActionTemplate();
			if (oTemplate) {
				oTemplate.destroy();
				oTemplate = null
			}
			for (var i = 0; i < this.modes.length; i++) {
				if (sKey == this.modes[i].key) {
					var aRes = this.modes[i].handler();
					iCount = aRes[0];
					oTemplate = aRes[1];
					break
				}
			}
			oTable.setRowActionTemplate(oTemplate);
			oTable.setRowActionCount(iCount)
		},
		reloadAgreementTableOnRequest: function () {
			if (this.getView().byId("AgreementTable").getBinding("AgrService")) {
				this.getView().byId("AgreementTable").getBinding("AgrService").refresh()
			} else {
				this.getView().byId("AgreementTable").getBinding().refresh()
			}
		},
		_onPatternMatchedDetailFromTasks: function (oEvent) {
			this._NavBack = "tasks"
			this._onPatternMatched(oEvent);
		},
		_onPatternMatchedDetail: function (oEvent) {
			this._NavBack = "master"
			this._onPatternMatched(oEvent);
		},
		_onPatternMatched: function (oEvent) {
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
			this._RequestId = parseInt( oArgs.RequestId, 10);
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
					this._doTheBinding();
				}.bind(this)
			});
		},

		_doTheBinding(sRequestId) {
			this.getModel().read("/AuthStrucSet(DpoRequest='" + this._RequestId + "',Uname='" + this.getModel("appModel").getProperty(
				"/Deputy/uname") + "')", {
				success: function (oData) {
					this.getModel("appModel").setProperty("/DetailRequestSettings", oData)
				}.bind(this)
			});
			var oItem = new sap.m.UploadCollectionItem({
				documentId: "{TermService>DocId}",
				fileName: "{TermService>Filename}",
				mimeType: "{TermService>Mimetype}",
				url: "{TermService>Link}",
				enableEdit: false,
				visibleEdit: false,
				enableDelete: false,
				visibleDelete: false
			});
			this.byId("UploadCollectionWriting").bindItems("TermService>/DpoNotificationSet('" + this._RequestId + "')/NotifAttchDirSet", oItem);

			var oUploadCollection = this.byId("UploadCollection");
			if (oUploadCollection) {
				var sUname = this.getModel("appModel").getProperty("/Deputy/uname");
				var aFilters = [];
				if (sUname) {
					aFilters.push(new Filter("Uname", sap.ui.model.FilterOperator.EQ, sUname));
				}
				oUploadCollection.getBinding("items").filter(aFilters);
			}

			this.byId("AgreementTable").filter([new Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId)]);
			oItem = new sap.m.UploadCollectionItem({
				documentId: "{AgrService>DocId}",
				fileName: "{AgrService>Filename}",
				mimeType: "{AgrService>Mimetype}",
				url: "{AgrService>Link}",
				enableEdit: false,
				visibleEdit: false,
				enableDelete: false,
				visibleDelete: false
			});
			if (this.getModel("appModel").getProperty("/Deputy/uname") !== null && this.getModel("appModel").getProperty("/Deputy/uname") !==
				"" && this.getModel("appModel").getProperty("/Deputy/uname") !== undefined) {
				this.byId("AgreementTable").bindRows({
					path: "AgrService>/AgreementSet",
					filters: [new Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId), new Filter("Uname", sap.ui.model.FilterOperator.EQ,
						this.getModel("appModel").getProperty("/Deputy/uname"))],
					events: {
						dataReceived: function (oEvent) {
							this.onDataReceivedAggreementTable(oEvent);
						}.bind(this)
					}
				})
			} else {
				this.byId("AgreementTable").bindRows({
					path: "AgrService>/AgreementSet",
					filters: [new Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId)],
					events: {
						dataReceived: function (oEvent) {
							this.onDataReceivedAggreementTable(oEvent);
						}.bind(this)
					}
				})
			}
			this._bindDetail(this._RequestId)
			var aFilter = new sap.ui.model.Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId);
			this.getView().byId("TaskTable").bindRows({
				path: "TermService>/TaskSet"
			});
			this.getView().byId("TaskTable").getBinding("rows").filter([aFilter]);
			this.getView().byId("TaskTable").getBinding().attachDataReceived(this.onDataReceivedTaskTable.bind(this))

		},

		onDataReceivedanotherRequestorsTable: function (oEvent) {
			var Count = oEvent.getSource().getLength();
			if (Count > 10) {
				Count = 10
			} else if (Count > 3) {
				Count = oEvent.getSource().getLength();
			} else {
				Count = 3;
			}
			this.getView().byId("AnotherRequestorsTable").setVisibleRowCount(Count);
		},
		onDataReceivedanotherHistoryTable: function (oEvent) {
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

		onDataReceivedAggreementTable: function (oEvent) {
			var Count = oEvent.getSource().getLength();
			if (Count > 10) {
				Count = 10
			} else if (Count > 3) {
				Count = oEvent.getSource().getLength();
			} else {
				Count = 3;
			}
			this.getView().byId("AgreementTable").setVisibleRowCount(Count);
		},

		onDataReceivedTaskTable: function (oEvent) {
			var Count = oEvent.getSource().getLength();
			if (Count > 10) {
				Count = 10
			} else if (Count > 3) {
				Count = oEvent.getSource().getLength();
			} else {
				Count = 3;
			}
			this.getView().byId("TaskTable").setVisibleRowCount(Count);
		},

		_bindDetail: async function (sRequestId) {
			sRequestId = parseInt(sRequestId, 10);
			await this.getModel().metadataLoaded();
			this.getView().bindElement({
				path: "/RequestDataSet('" + sRequestId + "')",
				events: {
					change: function (oEvent) {}.bind(this),
					dataReceived: function (oEvent) {}.bind(this)
				}
			});
			this.getView().getModel("TermService").read("/DpoNotificationSet(Request='" + this._RequestId + "')", {
				success: function (oData) {
					this.getView().byId("WritingStatusText").setText(oData.NotifStatusDesc)
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onCreateAgreementPress: function (oEvent) {
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}

			if (this.getModel("appModel").getProperty("/Deputy/uname").length > 0) {
				this.getView().getModel("AgrService").create("/AgreementSet", {
					DpoRequest: this._RequestId,
					Uname: this.getModel("appModel").getProperty("/Deputy/uname")
				}, {
					success: function (e) {
						this.getRouter().navTo("detailAgreement", {
							AgreementId: e.DpoAgreement,
							RequestId: this._RequestId,
							Refresh: Uname
						})
						this.getRouter().navTo("createAgreement", {
							AgreementId: e.DpoAgreement,
							RequestId: this._RequestId,
							Refresh: Uname
						});
					}.bind(this),
					error: function (e) {
						//var t = "New Leave request could not be created, oData are not responding.";
						MessageToast.show(e)
					}
				});
			} else {
				this.getView().getModel("AgrService").create("/AgreementSet", {
					DpoRequest: this._RequestId
				}, {
					success: function (e) {
						this.getRouter().navTo("detailAgreement", {
							AgreementId: e.DpoAgreement,
							RequestId: this._RequestId,
							Refresh: Uname
						})
						this.getRouter().navTo("createAgreement", {
							AgreementId: e.DpoAgreement,
							RequestId: this._RequestId,
							Refresh: Uname
						});
					}.bind(this),
					error: function (e) {
						//var t = ".";
						MessageToast.show(e)
					}
				})
			}

		},
		onNavigateToDetailAgreementPress: function (e) {
			var t = e.getSource().getBindingContext("AgrService").getObject().DpoAgreement;
			var n = e.getSource().getBindingContext("AgrService").getObject().DpoRequest;
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("detailAgreement", {
				AgreementId: sAgreementId,
				RequestId: sRequestId,
				Refresh: Uname
			})
		},
		onNextStepPress: function (oEvent) {
			this.ChangeDeputyBindingPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
			var oView = this.getView();
			this._pDialog = Fragment.load({
				id: oView.getId(),
				name: "ZHR_DPO_REQUEST.fragment.NextStepRequest",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				return oDialog
			});
			this._pDialog.then(function (oDialog) {
				this.getView().byId("NextStepSelect");
				oDialog.bindElement(this.ChangeDeputyBindingPath);
				oDialog.open()
			}.bind(this))
		},
		onEditPress: function () {
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("update", {
				RequestId: this._RequestId,
				Refresh: Uname
			})
		},
		onTextsOfRequestPress: function () {
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("textsOfRequest", {
				RequestId: this._RequestId,
				Refresh: Uname
			})
		},
		onChangeTermToRequestPress: function (e) {
			this.ElementBindingView = this.getView().getBindingContext().getPath();
			var t = this.getView();
			this._changeTermOfRequestDialog = Fragment.load({
				id: t.getId(),
				name: "ZHR_DPO_REQUEST.fragment.ChangeTermOfRequest",
				controller: this
			}).then(function (e) {
				t.addDependent(e);
				return e
			});
			this._changeTermOfRequestDialog.then(function (e) {
				e.bindElement(this.ElementBindingView);
				e.open()
			}.bind(this))
		},
		onTermValueHelpPress: function (e) {
			var i = e.getSource().getValue(),
				s = this.getView();
			if (!this._requestValueHelpDialog) {
				this._requestValueHelpDialog = Fragment.load({
					id: s.getId(),
					name: "ZHR_DPO_REQUEST.fragment.TermValueHelp",
					controller: this
				}).then(function (e) {
					s.addDependent(e);
					return e
				})
			}
			this._requestValueHelpDialog.then(function (e) {
				var oDate = new Date();
				var oDateFormat = DateFormat.getInstance({ pattern: "yyyy-MM-dd" });
				var sFormattedDate = oDateFormat.format(oDate);
				e.getBinding("items").filter([new Filter("TermDate", sap.ui.model.FilterOperator.GE, sFormattedDate)]);
				e.open()
			})
		},
		onValueHelpTermChosen: function (e) {
			var t = e.getParameter("selectedItem");
			this.byId("TermIdAddTermDialog2").setValue(t.getTitle())
			this.byId("TermIdAddTermDialog").setValue(t.getNumberUnit())
		},
		onTermValueHelpSearch: function (e) {
			var n = e.getParameter("value");
			var i = this.getView();
			this._requestValueHelpDialog.then(function (e) {
				var oDate = new Date();
				var oDateFormat = DateFormat.getInstance({ pattern: "yyyy-MM-dd" });
				var sFormattedDate = oDateFormat.format(oDate);
				var FilterTerm = new Filter({
					filters: [new Filter("TermDate", sap.ui.model.FilterOperator.GE, sFormattedDate), new Filter("Location", sap.ui.model.FilterOperator.Contains, n),
						new Filter("StatusDesc", sap.ui.model.FilterOperator.Contains, n), new Filter("ProcessDesc", sap.ui.model.FilterOperator.Contains, n),
						new Filter("UnionOrg", sap.ui.model.FilterOperator.Contains, n)
					],
					and: false
				});
				e.getBinding("items").filter(FilterTerm)
			})
		},
		onChangeTermOfRequestialogSuccess: function (e) {
			var t = this.byId("TermIdAddTermDialog").getValue();
			this.DialogToClose = e.getSource().getParent();
			this.getView().getModel().callFunction("/ChangeTermOnRequest", {
				method: "GET",
				urlParameters: {
					DpoRequest: this._RequestId,
					TermId: t
				},
				success: function (e, t) {
					this.getView().getElementBinding().refresh();
					this.getView().byId("HistoryTable").getBinding("rows").refresh();
					
					var n = this.getView().getModel("i18n").getResourceBundle().getText("msg.addSuccessDeadline");
					 
					sap.m.MessageToast.show(n);
					this.DialogToClose.destroy()
				}.bind(this),
				error: function (e) {
					var t = "Nastala chyba.";
					sap.m.MessageToast.show(t)
				}.bind(this)
			})
		},
		onNextStepConfirmPress: function (e) {
			var t = this.getView().byId("NextStepSelect").getSelectedKey();
			var n = this.getView().byId("Clarification").getValue();
			this.DialogToClose = e.getSource().getParent();
			this.getView().getModel().callFunction("/NextStep", {
				method: "GET",
				urlParameters: {
					RequestID: this._RequestId,
					NextStatus: t,
					Clarification: n,
					actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
						"/Deputy/uname")
				},
				success: function (e, t) {
					var n = this.getView().getModel("i18n").getProperty("processedSuccessfully");
					sap.m.MessageToast.show(n);
					this.DialogToClose.destroy();
					this.navBackToMaster()
				}.bind(this),
				error: function (e) {
					var t = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(e)
				}.bind(this)
			})
		},
		onAddWritingToRequest: function () {
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("writingFromDetail", {
				RequestId: this._RequestId,
				Refresh: Uname
			})
		},
		onBothPdfPress: function (oEvent) {
			this.onInternalPdfPress(oEvent);
			this.onExternalPdfPress(oEvent)
		},
		onAgreementDownloadPress: function (oEvent) {
			var sLink = oEvent.getSource().getParent().getBindingContext("AgrService").getObject().Link;
			var sDpoAgreement = oEvent.getSource().getParent().getBindingContext("AgrService").getObject().DpoAgreement;
			var oLink = document.createElement("a");
			oLink.setAttribute("href", sLink);
			oLink.setAttribute("download", this._RequestId + "-Dohoda" + sDpoAgreement + ".pdf");
			document.body.appendChild(oLink);
			oLink.click();
			document.body.removeChild(oLink)
		},
		onInternalPdfPress: function (oEvent) {
			var oLink = document.createElement("a");
			oLink.setAttribute("href", "/sap/opu/odata/sap/ZHR_DPO_REQUEST01_SRV/ShowPdfSet(DpoRequest='" + this._RequestId +
				"',FormType='INT')/$value");
			oLink.setAttribute("download", this._RequestId + "-internal.pdf");
			document.body.appendChild(oLink);
			oLink.click();
			document.body.removeChild(oLink);
			this.getView().getModel().callFunction("/PDFFormInt", {
				method: "GET",
				urlParameters: {
					RequestID: this._RequestId,
					FormType: "INT"
				},
				success: function (oData, oResponse) {}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onExternalPdfPress: function (oEvent) {
			var oLink = document.createElement("a");
			oLink.href = "/sap/opu/odata/sap/ZHR_DPO_REQUEST01_SRV/ShowPdfSet(DpoRequest='" + this._RequestId + "',FormType='EXT')/$value";
			oLink.download = this._RequestId + "-external.pdf";
			oLink.dispatchEvent(new MouseEvent("click"));
			this.getView().getModel().callFunction("/PDFFormExt", {
				method: "GET",
				urlParameters: {
					RequestID: this._RequestId,
					FormType: "EXT"
				},
				success: function (oData, oResponse) {}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},

		onCopyPress: function (oEvent) {
			this.getView().getModel().callFunction("/CopyRequest", {
				method: "GET",
				urlParameters: {
					RequestID: this._RequestId,
					CreateReq: "Copy",
					OriginUser: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
						"/Deputy/uname")
				},
				success: function (oData, oResponse) {
					var sMsg;
					if (oData.DpoRequest == '' || oData.DpoRequest == ' ') {
						
						var messageText = this.getView().getModel("i18n").getResourceBundle().getText("msg.errorAddNewRequest");
						sap.m.MessageToast.show(messageText);
					} else {
						sMsg = this.getView().getModel("i18n").getProperty("processedSuccessfully");
						sap.m.MessageToast.show(sMsg);
						var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
						if (Uname == '' || Uname == null || Uname == "SELF") {
							Uname = this.utf8_to_b64('SELF')
						} else {
							Uname = this.utf8_to_b64(Uname);
						}
						this.getRouter().navTo("update", {
							RequestId: oData.DpoRequest,
							Refresh: Uname
						})
					}
				}.bind(this),
				error: function (oError) {
					var sMsg = "Nastala chyba.";
					sap.m.MessageToast.show(sMsg);
				}.bind(this)
			})
		},
		onStornoPress: function (oEvent) {
			if (!this.oStornoRequestDialog) {
				this.oStornoRequestDialog = new Dialog({
					type: DialogType.Message,
					title: this.getView().getModel("i18n").getProperty("stornoRequestTitle"),
					content: new Text({
						text: this.getView().getModel("i18n").getProperty("stornoRequestText")
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getProperty("yes"),
						press: function () {
							this.getView().getModel().callFunction("/Storno", {
								method: "GET",
								urlParameters: {
									RequestID: this._RequestId
								},
								success: function (oData, oResponse) {
									this.getView().getElementBinding().refresh();
									var sMsg = this.getView().getModel("i18n").getProperty("requestStorno");
									this.getView().byId("HistoryTable").getBinding("rows").refresh();
									sap.m.MessageToast.show(sMsg)
								}.bind(this),
								error: function (oError) {
									sap.m.MessageToast.show(oError)
								}.bind(this)
							});
							this.oStornoRequestDialog.close()
						}.bind(this)
					}),
					endButton: new Button({
						text: this.getView().getModel("i18n").getProperty("no"),
						press: function () {
							this.oStornoRequestDialog.close()
						}.bind(this)
					})
				})
			}
			this.oStornoRequestDialog.open()
		},
		onDeletePress: function (oEvent) {
			if (!this.oDeleteRequestDialog) {
				this.oDeleteRequestDialog = new Dialog({
					type: DialogType.Message,
					title: this.getView().getModel("i18n").getProperty("deleteRequestTitle"),
					content: new Text({
						text: this.getView().getModel("i18n").getProperty("deleteRequestText")
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getProperty("yes"),
						press: function () {
							this.getView().getModel().callFunction("/Delete", {
								method: "GET",
								urlParameters: {
									RequestID: this._RequestId
								},
								success: function (oData, oResponse) {
									this.getView().getElementBinding().refresh();
									var sMsg = this.getView().getModel("i18n").getProperty("requestDeleted");
									sap.m.MessageToast.show(sMsg)
								}.bind(this),
								error: function (oError) {
									sap.m.MessageToast.show(oError)
								}.bind(this)
							});
							this.oDeleteRequestDialog.close()
						}.bind(this)
					}),
					endButton: new Button({
						text: this.getView().getModel("i18n").getProperty("no"),
						press: function () {
							this.oDeleteRequestDialog.close()
						}.bind(this)
					})
				})
			}
			this.oDeleteRequestDialog.open()
		},
		onNavBack: function () {
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.publish("reloadRequestsMaster");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			if (this._NavBack == "master") {
				oRouter.navTo("master", true);
			} else {
				var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
				if (Uname == '' || Uname == null || Uname == "SELF") {
					Uname = this.utf8_to_b64('SELF')
				} else {
					Uname = this.utf8_to_b64(Uname);
				}
				this.getRouter().navTo(this._NavBack, {
					Refresh: Uname
				})
			}
		},
		navBackToMaster: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.publish("reloadRequestsMaster");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getRouter().navTo("master", {}, true);
			this.getView().getBindingContext().getModel().resetChanges()
		},
		onEmailPress: function (oEvent) {
			var sContent =
				"To: User <user@domain.demo>\nSubject: Subject\nX-Unsent: 1\nContent-Type: text/html\n\n<html>\n<head><style>body{font-family: Arial;font-size: 13px;}, html, table {font-family: Calibri, Arial, sans-serif;}table, th, td {border: 1px solid black;}thead {text-align: center;font-size: 1.2em;color: navy;background-color: silver;font-weight: bold;}tbody td {text-align: center;}</style></head><body>\nTest message\n<table style='width:100%;border: 1px solid black'><tr><th>Firstname</th><th>Lastname</th><th>Age</th></tr><tr><td>Jill</td><td>Smith</td><td>50</td></tr><tr><td>Eve</td><td>Jackson</td><td>94</td></tr></table></body>\n</html>";
			var sUrl = null,
				fnCreateUrl = function (sData) {
					var oBlob = new Blob([sData], {
						type: "text/plain"
					});
					if (sUrl !== null) {
						window.URL.revokeObjectURL(sUrl)
					}
					sUrl = window.URL.createObjectURL(oBlob);
					return sUrl
				};
			var oLink = document.createElement("a");
			oLink.href = fnCreateUrl(sContent);
			oLink.style.display = "none";
			oLink.download = "message.eml";
			oLink.dispatchEvent(new MouseEvent("click"))
		},
		onEmailPress1: function (oEvent) {
			var sContent = "To: Demo-Recipient <demo@demo.example.com>\n" + "Subject: EML with attachments\n" + "X - Unsent: 1\n" +
				"Content - Type: multipart / mixed;\n" + "boundary = --boundary_text_string\n" + "-- --boundary_text_string\n" +
				"Content - Type: text / html;\n" + "charset = UTF - 8\n" + "\t< html >\n" + "\t< body >\n" +
				"\t< p > Example < /p> < /body> < /html>\n" + "-- --boundary_text_string\n" + "Content - Type: application / pdf;\n" +
				"name = example.pdf\n" + "Content - Transfer - Encoding: base64\n" + "Content - Disposition: attachment\n" + "ZXhhbXBsZQ ==\n" +
				"-- --boundary_text_string\n" + "Content - Type: application / octet - stream;\n" + "name = demo.log\n" +
				"Content - Transfer - Encoding: base64\n" + "Content - Disposition: attachment\n" + "ZXhhbXBsZQ ==\n" +
				" -- --boundary_text_string--\n";
			var sUrl = null,
				fnCreateUrl = function (sData) {
					var oBlob = new Blob([sData], {
						type: "text/plain"
					});
					if (sUrl !== null) {
						window.URL.revokeObjectURL(sUrl)
					}
					sUrl = window.URL.createObjectURL(oBlob);
					return sUrl
				};
			var oLink = document.createElement("a");
			oLink.href = fnCreateUrl(sContent);
			oLink.style.display = "none";
			oLink.download = "message.eml";
			oLink.dispatchEvent(new MouseEvent("click"))
		},
		onCreatePress1: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			if (this.getModel().getData(this.getView().getElementBinding().getPath()).TemplateCode == "OZ01" && this.getModel().getData(this
					.getView()
					.getElementBinding().getPath()).Theme == "OZ") {
				if (this.getModel().getData(this.getView().getElementBinding().getPath()).A0004Filled) {
					this.getView().getModel().callFunction("/Save", {
						method: "GET",
						urlParameters: {
							DpoRequest: this._RequestId,
							NextStatus: "",
							Clarification: "",
							button_press: "SaveAndSend",
							actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
								"/Deputy/uname")
						},
						success: function (oData) {
							this.CreatedFlag = true;
							var sMsg = "�sp�n� provedeno.";
							sap.m.MessageToast.show(sMsg);
							this.navBackToMaster()
						}.bind(this),
						error: function (oError) {
							var sMsg = "Error.";
							sap.m.MessageToast.show(oError)
						}.bind(this)
					});
				} else {
					var sMsg = this.getModel("i18n").getProperty("savedNotFilledAttachment");
					sap.m.MessageBox.error(sMsg);
				}
			} else {
				this.getView().getModel().callFunction("/Save", {
					method: "GET",
					urlParameters: {
						DpoRequest: this._RequestId,
						NextStatus: "",
						Clarification: "",
						button_press: "SaveAndSend",
						actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
							"/Deputy/uname")
					},
					success: function (oData) {
						this.CreatedFlag = true;
						var sMsg = "�sp�n� provedeno.";
						sap.m.MessageToast.show(sMsg);
						this.navBackToMaster()
					}.bind(this),
					error: function (oError) {
						var sMsg = "Error.";
						sap.m.MessageToast.show(oError)
					}.bind(this)
				});
			}
		},

		agreementProposalPress: function (oEvent) { //DohNavrh
			this.getView().getModel().callFunction("/GetMailContacts", {
				method: "GET",
				urlParameters: {
					button_press: "DohNavrh"
				},
				success: function (oData, oResponse) {
					this.getView().getModel().callFunction("/GetEmailSubjectBody", {
						method: "GET",
						urlParameters: {
							RequestID: this._RequestId,
							button_press: "DohNavrh"
						},
						success: function (oData2, oResponse2) {
							this.generateAndSendEmailAgreement(oData, oData2, 'ND3')
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
		agreementFinal1Press: function (oEvent) { // DohFinal1
			this.getView().getModel().callFunction("/GetMailContacts", {
				method: "GET",
				urlParameters: {
					button_press: "DohFinal1"
				},
				success: function (oData, oResponse) {
					this.getView().getModel().callFunction("/GetEmailSubjectBody", {
						method: "GET",
						urlParameters: {
							RequestID: this._RequestId,
							button_press: "DohFinal1"
						},
						success: function (oData2, oResponse2) {
							this.generateAndSendEmailAgreement(oData, oData2, 'FD3')
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
		agreementFinal2Press: function (oEvent) { // DohFinal2
			this.getView().getModel().callFunction("/GetMailContacts", {
				method: "GET",
				urlParameters: {
					button_press: "DohFinal2"
				},
				success: function (oData, oResponse) {
					this.getView().getModel().callFunction("/GetEmailSubjectBody", {
						method: "GET",
						urlParameters: {
							RequestID: this._RequestId,
							button_press: "DohFinal2"
						},
						success: function (oData2, oResponse2) {
							this.generateAndSendEmailAgreement(oData, oData2, 'DD1')
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
		generateAndSendEmailAgreement: function (oData, oData2, status) {
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			var Filters;
			if (Uname == null || Uname == "") {
				Filters = [new sap.ui.model.Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId)];
			} else {
				Filters = [new sap.ui.model.Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId), new sap.ui.model.Filter(
					"Uname",
					sap.ui.model.FilterOperator.EQ, Uname)];
			}

			this.getView().getModel("AgrService").read(this.getView().byId("AgreementTable").getBinding("rows").sDeepPath, {
				filters: Filters,
				success: function (oResponse) {
					var sUrl = "https://" + window.location.host + "/sap/bc/ui2/FLP?sap-client=010#zhr_dpo_request-display&/detail/";
					var sOrigin = window.location.origin;
					var aResults = oResponse.results;
					var sTo = "To:" + oData.Mails + "\n";
					var sSubject = "Subject:" + oData2.SubjectText +
						"\nX-Unsent: 1\nContent-Type: text/html; charset=utf-8\n\n<html>\n<head><style>body{font-family: Arial;font-size: 13px;}, html, table {font-family: Arial;}table, th, td {border: 1px solid black;}thead {text-align: center;font-size: 1.2em;color: navy;background-color: silver;font-weight: bold;}tbody td {text-align: center;}</style></head>";
					var sBody = "<body>\n" + oData2.BodyText + "<br><br><br>" + '<a href="' + sUrl + this._RequestId + '/U0VMRg==' +
						'  ">Detail ��dosti</a>';
					var sTable = "<br><br><table style='width:100%;border: 1px solid black'>";
					sTable += "<tr><th>N�zev dohody</th><th>T�ma dohody</th><th>Dokument</th></tr>";
					for (var d = 0; d < aResults.length; d++) {
						if (aResults[d].Status == status) {
							sTable += "<tr><td>" + aResults[d].Name + "</td><td>" + aResults[d].TemplateDesc +
								"</td><td>" + '<a href="' + sOrigin + aResults[d].Link + '  ">Zobrazit</a>' + "</td></tr>"
						}
					}
					sTable += "</table>";
					var sContent = sTo + sSubject + sBody + sTable + "</body>\n</html>";
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

		onA004LinkPress: function (oEvent) {
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			this.getRouter().navTo("a004fromdetail", {
				RequestId: this._RequestId,
				Refresh: Uname
			}, true);
		},
	})
});