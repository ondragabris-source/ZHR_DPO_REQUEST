sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/ui/model/FilterOperator",
	"sap/ui/table/RowAction",
	"sap/ui/table/RowActionItem"
], function (BaseController, Filter, Fragment, FilterOperator, RowAction, RowActionItem) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("writingFromTerm").attachPatternMatched(this._onPatternMatchedWritingTerm, this);
			this._oRouter.getRoute("writingFromDetail").attachPatternMatched(this._onPatternMatchedWritingDetail, this)
			
			var fnPress = this.fnPress.bind(this);
			var fnPressDetail = this.onItemPressed.bind(this);
			var fnPressUpdate = this.onEditPress.bind(this);
			var fnPressDelete = this.onDeleteItemPressed.bind(this);
			var that = this;
			if(sap.ui.getCore().getConfiguration().getLanguage()=='cs-CZ'){
				this.UpdateText='Upravit';
			} else {
				this.UpdateText='Edit';
			}
			this.modes = [{
				key: "NavigationDelete",
				text: "Navigation & Delete",
				handler: function () {
					var oTemplate = new RowAction({
						items: [
							new RowActionItem({
								type: "Navigation",
								press: fnPressDetail
							}),
							new RowActionItem({
								type: "Delete",
								press: fnPressDelete
							}),
							new RowActionItem({
								icon: "sap-icon://edit",
								text: that.UpdateText,
								press: fnPressUpdate
							})
						]
					});
					return [2, oTemplate];
				}
			}];
			this.switchState("NavigationDelete");
		},
		fnPress: function (sKey) {},

		onDeleteItemPressed: function (oEvent) {
			var View = this.getView();
			this.ElementBindingView = oEvent.getSource().getBindingContext("TermService").getPath();
			if (!this._deleteDialog) {
				this._deleteDialog = Fragment.load({
					id: View.getId(),
					name: "ZHR_DPO_REQUEST.fragment.TaskDelete",
					controller: this
				}).then(function (Event) { 
					View.addDependent(Event);
					return Event;
				});
			}
			this._deleteDialog.then(function (Dialog) {
				Dialog.bindElement("TermService>" + this.ElementBindingView);
				Dialog.open();
			}.bind(this));
		},

		readSettings: function() {

			this.getModel().read("/AuthStrucSet(DpoRequest='" + this._RequestId + "',Uname='" + this.getModel("appModel").getProperty(
					"/Deputy/uname") + "')", {
					success: function (oData) {
						this.getModel("appModel").setProperty("/DetailRequestSettings", oData);
					}.bind(this)
				});

		},

		deleteTask: function (oEvent) {
			this.getView().getModel("TermService").remove(oEvent.getSource().getBindingContext("TermService").getPath(), {
				method: "DELETE",
				success: function (oData) {
					var sMsg = this.getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(sMsg);
					this.getView().byId("DeleteTaskDialog").close();

					if (this.getView().byId("DetailTaskDialog")) {
						this.getView().byId("DetailTaskDialog").destroy();
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show(oError);
				}.bind(this)
			});
		},

		onItemPressed: function (oEvent) {
			var View = this.getView();
			this.ElementBindingView = oEvent.getSource().getBindingContext("TermService").getPath();

			this._pDialog1 = Fragment.load({
				id: View.getId(),
				name: "ZHR_DPO_REQUEST.fragment.TaskDetail",
				controller: this
			}).then(function (Event) {
				View.addDependent(Event);
				return Event;
			});
			this._pDialog1.then(function (Dialog) {
				Dialog.bindElement("TermService>" + this.ElementBindingView);
				Dialog.open();
			}.bind(this));
		},

		onEditPress: function (oEvent) {
			var View = this.getView();
			this.ElementBindingView = oEvent.getSource().getBindingContext("TermService").getPath();

				this._editDialog = Fragment.load({
					id: View.getId(),
					name: "ZHR_DPO_REQUEST.fragment.TaskUpdate",
					controller: this
				}).then(function (Event) {
					View.addDependent(Event);
					return Event;
				});
			this._editDialog.then(function (Dialog) {
				Dialog.bindElement("TermService>" + this.ElementBindingView);
				Dialog.open();
			}.bind(this));
		},
		onUpdateSavePress: function (oEvent) {
			this.saveData("TermService");
			this.onDestroyDialog(oEvent);
		},

		switchState: function (sKey) {
			var oTable = this.byId("TaskTable");
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
		_onPatternMatchedWritingTerm: function (oEvent) {
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
			this._RequestId = oArgs.RequestId;
			this._Refresh = this.b64_to_utf8(oArgs.Refresh);
			this._bindWriting()
		},
		_onPatternMatchedWritingDetail: function (oEvent) {
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
			this._RequestId = oArgs.RequestId;
			this._Refresh = this.b64_to_utf8(oArgs.Refresh);
			this._bindWriting();
		},
		_bindWriting: async function (oData) {
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
				}.bind(this)
			});
			await this.getModel("TermService").metadataLoaded();
			this.getView().bindElement({
				path: "TermService>/DpoNotificationSet(Request='" + this._RequestId + "')",
				events: {
					change: function (oEvent) {}.bind(this),
					dataReceived: function (oEvent) {}.bind(this)
				}
			});


			var aFilter = new sap.ui.model.Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId);
			this.getView().byId("TaskTable").bindRows({
				path: "TermService>/TaskSet"
			});
			this.getView().byId("TaskTable").getBinding("rows").filter([aFilter]);
			
			this.readSettings();
		},

		onNavBack: function () {
			window.history.go(-1)
		},
		onTemplateClick: function (oEvent) {
			this.getModel("TermService").read("/WordTemplateLinkSet(DpoRequest='" + this._RequestId + "',LINK='')", {
				success: function (oData) {
					window.open(oData.LINK, "_blank").focus()
				}.bind(this)
			})
		},
		onBeforeUploadStarts: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			for (var i = 0; i < this.getView().byId("UploadCollection").getItems().length; i++) {
				if (this.getView().byId("UploadCollection").getItems()[i].getProperty("fileName") == oEvent.getParameter("fileName")) {
					var pom = this.getModel("i18n").getProperty("ThemeOrTemplateNotFilled");
					pom="Pøíloha má stejný název jako již existující pøíloha. Nahrání pøílohy bylo zastaveno.";
					sap.m.MessageBox.error(pom);
				}
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
		onNextStepWritingDialog: function (oEvent) {
			this.ElementBindingView = this.getView().getBindingContext("TermService").getPath();
			var t = this.getView();
			this._NextStepWriting = Fragment.load({
				id: t.getId(),
				name: "ZHR_DPO_REQUEST.fragment.NextStepWriting",
				controller: this
			}).then(function (e) {
				t.addDependent(e);
				return e
			});
			this._NextStepWriting.then(function (e) {
				e.setModel(this.getOwnerComponent().getModel("TermService"));
				e.bindElement(this.ElementBindingView);
				e.open()
			}.bind(this))
		},
		onNextStepConfirmPress: function (oEvent) {
			this.DialogToClose = oEvent.getSource().getParent();
			var sNotifStatus = this.getView().byId("NotifStatus").getSelectedKey();
			var sStatusRequest = this.getView().byId("StatusRequest").getSelectedKey();
			var sClarification = this.getView().byId("Comment").getValue();
			this.DialogToClose = oEvent.getSource().getParent();
			this.getView().getModel("TermService").callFunction("/NotificationToRequest", {
				method: "GET",
				urlParameters: {
					DpoRequest: this._RequestId,
					NotifStatus: sNotifStatus,
					StatusRequest: sStatusRequest,
					Clarification: sClarification,
					actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
						"/Deputy/uname")
				},
				success: function (oData, oResponse) {
					var sMsg = this.getView().getModel("i18n").getProperty("processedSuccessfully");
					sap.m.MessageToast.show(sMsg);
					this.getView().getElementBinding("TermService").refresh();
					var n = this.getOwnerComponent().getEventBus();
					n.publish("reloadRequestsMaster");
					n.publish("reloadPointsOfDiscussion");
					this.DialogToClose.destroy()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},
		onFileDeleted: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var sDocId = oEvent.getParameter("documentId");
			this.getView().getModel("TermService").remove(oEvent.getParameter("item").getBindingContext("TermService").getPath(), {
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

		onCreateTask: function (oEvent) {
			var View = this.getView();
			this._pDialog = sap.ui.core.Fragment.load({
				id: View.getId(),
				name: "ZHR_DPO_REQUEST.fragment.TaskCreate",
				controller: this
			}).then(function (Event) {
				View.addDependent(Event);
				return Event;
			});

			this._pDialog.then(function (Event) {
				Event.open();
			}.bind(this));
		},

		onPeopleValueHelpRequest: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var sValue = oEvent.getSource().getValue(),
				oView = this.getView();
			var sRequestId = this._RequestId;
			this._pValueHelpDialog = sap.ui.core.Fragment.load({
				id: oView.getId(),
				name: "ZHR_DPO_REQUEST.fragment.PeopleValueHelpTasks",
				controller: this
			}).then(function (e) {
				oView.addDependent(e);
				return e
			});
			this._pValueHelpDialog.then(function (e) {
				var sValue="";
				var s = new sap.ui.model.Filter({
					filters: [new Filter("Pernr", FilterOperator.EQ, sValue), new Filter("Uname", FilterOperator.EQ, sValue), new Filter("NameFull", FilterOperator.EQ, sValue), new Filter("Role", FilterOperator.EQ, 'HRBP'), new Filter(
						"DpoRequest", FilterOperator.EQ, sRequestId)],
					and: true
				});
				e.getBinding("items").filter(s)
				e.open(sValue)
			})
		},

		onValuePersonHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var sRequestId = this._RequestId;
			var oFilter = new sap.ui.model.Filter({
				filters: [new Filter("Pernr", FilterOperator.EQ, sValue), new Filter("Uname", FilterOperator.EQ, sValue), new Filter("NameFull", FilterOperator.EQ, sValue), new Filter("Role", FilterOperator.EQ, 'HRBP'), new Filter(
					"DpoRequest", FilterOperator.EQ, sRequestId)],
				and: true
			});

			oEvent.getSource().getBinding("items").filter(oFilter)
		},

		onValueHelpPersonChosen: function (oEvent) {
			this._Person = oEvent.getParameter("selectedItem").getBindingContext("TermService").getObject();
			this.byId("SelectedPersonDeputy").setValue(oEvent.getParameter("selectedItem").getTitle());
			this.byId("SelectedPersonDeputy").fireLiveChange();
			oEvent.getSource().destroy()
		},

		onCreateTaskConfirmPress: function (oEvent) {
			var Person = this._Person;
			this._Person = null;
			if(Person == "" || Person == null){
				sap.m.MessageBox.error("Nebyla zvolena osoba.");
				return;
			}
			
			var Status = "N";
			var StatusDescr = "Nesplnìno";
			var TaskText = this.byId("CommentNewTask").getValue();
			var FinishDate = this.byId("termNewTask").getValue();
			this.getView().getModel("TermService").create("/TaskSet", {
				DpoRequest: this._RequestId,
				TaskText: TaskText,
				Uname: Person.Uname,
				Pernr: Person.Pernr,
				Status: Status,
				FinishDate: FinishDate,
				FullName: Person.Fullname,
				StatusDescr: StatusDescr
			}, {
				success: function (oData) {
					var sMsg = this.getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(sMsg);
					this.getView().byId("CreateTaskDialog").destroy();
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error.";
					sap.m.MessageToast.show(oError);
					this.getView().setBusy(false)
				}.bind(this)
			})
		},

		onDestroyDialogWithReset: function (oEvent) {
			this.getModel("TermService").resetChanges();
			this._Person = null;
			oEvent.getSource().getParent().destroy()
		}
	})
});