sap.ui.define(["ZHR_DPO_REQUEST/lib/controller/Base.controller", "sap/ui/model/Filter", "sap/ui/core/Fragment",
	"sap/ui/model/FilterOperator", "sap/ui/core/format/DateFormat"
	
], function (BaseController, Filter, Fragment, FilterOperator,DateFormat) {
	"use strict";
	return BaseController.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("update").attachPatternMatched(this._onPatternMatchedUpdate, this);
			this._oRouter.getRoute("create").attachPatternMatched(this._onPatternMatchedCreate, this);

			this.oItemTemplate = new sap.m.UploadCollectionItem({
				documentId: "{DocId}",
				fileName: "{Filename}",
				mimeType: "Mimetype",
				url: "{Link}",
				enableEdit: true,
				enableDelete: true,
				visibleDelete: true,
				visibleEdit: true
			});

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
		testingPurpose: function () {
			var fnOpenChange = this.openChangeOtherRequestorDialog.bind(this);
			var fnOpenDelete = this.openDeleteAdditionalRequestorDialog.bind(this);
			var s;
			this.modes = [{
				key: "Edit",
				text: "Edit",
				handler: function () {
					var e = new sap.ui.table.RowAction({
						items: [new sap.ui.table.RowActionItem({
							icon: "sap-icon://delete",
							press: fnOpenDelete,
							visible: "{Available}"
						})]
					});
					return [1, e]
				}
			}, {
				key: "None",
				text: "None",
				handler: function () {
					var e = new sap.ui.table.RowAction({
						items: []
					});
					return [1, e]
				}
			}];
			var a = this.byId("OtherRequestorsTable");
			var i = 0;
			var o = a.getRowActionTemplate();
			if (this.getModel("appModel").getProperty("/DetailRequestSettings/Role") == 'ZAD_NEXT') {
				s = "None";
			} else {
				s = "Edit";
			}
			if (o) {
				o.destroy();
				o = null
			}
			for (var n = 0; n < this.modes.length; n++) {
				if (s == this.modes[n].key) {
					var r = this.modes[n].handler();
					i = r[0];
					o = r[1];
					break
				}
			}
			a.setRowActionTemplate(o);
			a.setRowActionCount(i)
		},
		openChangeOtherRequestorDialog: function (e) {},
		onDeleteOtherRequestoryDialog: function (e) {},
		isNumeric: function (e) {
			if (typeof e != "string") return false;
			return !isNaN(e) && !isNaN(parseFloat(e))
		},
		_onPatternMatchedCreate: function (oEvent) {
			this.SelectedTemplate = "";
			this.SelectedTheme = "";
			this.getView().getModel("appModel").setProperty("/URL", "google");
			this.CreatedFlag = false;	
			this.getModel("appModel").setProperty("/createdFlag", this.CreatedFlag);
			this.getView().byId("Tittle").setText(this.getView().getModel("i18n").getResourceBundle().getText("createRequest"));
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
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
					this._doTheBindingCreate();
				}.bind(this)
			});
		},
		_doTheBindingCreate: function () {
			this.getModel().read("/AuthStrucSet(DpoRequest='" + this._RequestId + "',Uname='" + this.getModel("appModel").getProperty(
				"/Deputy/uname") + "')", {
				success: function (oData) {
					this.getModel("appModel").setProperty("/DetailRequestSettings", oData)
					this.testingPurpose();
				}.bind(this)
			});
			this.getView().bindElement({
				path: "/RequestDataSet('" + this._RequestId + "')",
				events: {
					change: function (oEvent) {
						this.getView().getBindingContext().getModel().refresh()
					}.bind(this),
					dataReceived: function (oEvent) {
						if (oEvent.getParameter("data").Theme != "") {
							var sTheme = oEvent.getParameter("data").Theme;
							var aFilters = [new Filter("Theme", sap.ui.model.FilterOperator.EQ, sTheme)];
							this.getView().getModel().read("/TemplateSet", {
								filters: aFilters,
								success: function (oData) {
									var oCombobox = this.getView().byId("TemplateCombobox");
									oCombobox.removeAllItems();
									for (var i = 0; i < oData.results.length; i++) {
										var oItem = new sap.ui.core.ListItem({
											key: oData.results[i].TemplateCode,
											text: oData.results[i].TemplateDesc,
											additionalText: oData.results[i].Process
										});
										oCombobox.addItem(oItem)
									}
									oCombobox.setBusy(false)
								}.bind(this)
							})
						}
					}.bind(this)
				}
			})

			var oUploadCollection = this.byId("UploadCollection");
			if (oUploadCollection) {
				var sUname = this.getModel("appModel").getProperty("/Deputy/uname");
				var aFilters = [];
				if (sUname) {
					aFilters.push(new Filter("Uname", FilterOperator.EQ, sUname));
				}
				if (oUploadCollection.getBinding("items")) {
					oUploadCollection.getBinding("items").filter(aFilters);
				}
			}
		},
		_onPatternMatchedUpdate: function (oEvent) {
			this._Old_RequestId = this._RequestId;
			this.getView().getModel("appModel").setProperty("/URL", "google");
			this.CreatedFlag = true;
			this.getModel("appModel").setProperty("/createdFlag", this.CreatedFlag);
			this.getView().byId("Tittle").setText(this.getView().getModel("i18n").getResourceBundle().getText("editRequest"));
			this.getView().unbindElement();
			var oArgs = oEvent.getParameter("arguments");
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
					this._doTheBindingUpdate();
				}.bind(this)
			});
		},
		_doTheBindingUpdate: function () {
			this.getModel().read("/AuthStrucSet(DpoRequest='" + this._RequestId + "',Uname='" + this.getModel("appModel").getProperty(
				"/Deputy/uname") + "')", {
				success: function (oData) {
					this.getModel("appModel").setProperty("/DetailRequestSettings", oData)
					this.testingPurpose();
				}.bind(this)
			});
			this.getView().bindElement({
				path: "/RequestDataSet('" + this._RequestId + "')",
				events: {
					change: function (oEvent) {
						if (oEvent.getParameter("data")) {
							if (oEvent.getParameter("data").TemplateCode != "") {
								this.SelectedTemplate = oEvent.getParameter("data").TemplateCode;
								this.SelectedTheme = oEvent.getParameter("data").Theme;
								var sTheme = oEvent.getParameter("data").Theme;
								var sTemplateCode = oEvent.getParameter("data").TemplateCode;
								var aFilters = [new Filter("Theme", sap.ui.model.FilterOperator.EQ, sTheme)];
								this.getView().getModel().read("/TemplateSet", {
									filters: aFilters,
									success: function (oData) {
										var oCombobox = this.getView().byId("TemplateCombobox");
										oCombobox.removeAllItems();
										for (var i = 0; i < oData.results.length; i++) {
											var oItem = new sap.ui.core.ListItem({
												key: oData.results[i].TemplateCode,
												text: oData.results[i].TemplateDesc,
												additionalText: oData.results[i].Process
											});
											oCombobox.addItem(oItem)
										}
										oCombobox.setSelectedKey(sTemplateCode);
										oCombobox.setBusy(false)
									}.bind(this)
								})
							}
						} else {
							var Data = this.getModel().getData(oEvent.getSource().getPath());
							if (Data.TemplateCode == "" && this._Old_RequestId == this._RequestId) Data.TemplateCode = this.SelectedTemplate;
							this.getView().getElementBinding().refresh();
							if (Data.TemplateCode != "") {
								this.SelectedTemplate = Data.TemplateCode;
								this.SelectedTheme = Data.Theme;
								var sTheme = Data.Theme;
								var sTemplateCode = Data.TemplateCode;
								var aFilters = [new Filter("Theme", sap.ui.model.FilterOperator.EQ, sTheme)];
								this.getView().getModel().read("/TemplateSet", {
									filters: aFilters,
									success: function (oData) {
										var oCombobox = this.getView().byId("TemplateCombobox");
										oCombobox.removeAllItems();
										for (var i = 0; i < oData.results.length; i++) {
											var oItem = new sap.ui.core.ListItem({
												key: oData.results[i].TemplateCode,
												text: oData.results[i].TemplateDesc,
												additionalText: oData.results[i].Process
											});
											oCombobox.addItem(oItem)
										}
										oCombobox.setSelectedKey(sTemplateCode);
										oCombobox.setBusy(false)
									}.bind(this)
								})
							}
						}
					}.bind(this)
				}
			});

			var oUploadCollection = this.byId("UploadCollection");
			if (oUploadCollection) {
				var sUname = this.getModel("appModel").getProperty("/Deputy/uname");
				var aFilters = [];
				if (sUname) {
					aFilters.push(new Filter("Uname", FilterOperator.EQ, sUname));
				}
				if (oUploadCollection.getBinding("items")) {
					oUploadCollection.getBinding("items").filter(aFilters);
				}
			}
		},
		onNavBack: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.publish("reloadRequestsMaster");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Uname = this.utf8_to_b64('SELF')
			} else {
				Uname = this.utf8_to_b64(Uname);
			}
			if (this.CreatedFlag) {
				this.getRouter().navTo("detail", {
					RequestId: this._RequestId,
					Refresh: Uname
				}, true)
			} else {
				this.getRouter().navTo("master", {}, true)
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
		navToAttachmentFour: function () {
			this.setSelectedItemsDropdown();
			this.saveData().then(function () {
				this.getView().getModel().callFunction("/Save", {
					method: "GET",
					urlParameters: {
						DpoRequest: this._RequestId,
						NextStatus: "",
						Clarification: "",
						button_press: "SaveOnly",
						actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
							"/Deputy/uname")
					},
					success: function (oData) {
						this.getView().getElementBinding().refresh(true)
						this.CreatedFlag = true;
						this.getModel("appModel").setProperty("/createdFlag", this.CreatedFlag);
						var sMsg = this.getModel("i18n").getProperty("draftSaved");
						sap.m.MessageToast.show(sMsg)

						var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
						if (Uname == '' || Uname == null || Uname == "SELF") {
							Uname = this.utf8_to_b64('SELF')
						} else {
							Uname = this.utf8_to_b64(Uname);
						}
						this.getRouter().navTo("a004fromcreate", {
							RequestId: this._RequestId,
							Refresh: Uname
						}, true)
					}.bind(this),
					error: function (oError) {
						this.getView().getElementBinding().refresh(true)
						var sMsg = "Nastala chyba p�i ukl�d�n� ��dosti.";
						sap.m.MessageToast.show(sMsg)
					}.bind(this)
				})
			}.bind(this))
		},
		onThemeSelectionChange: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var sKey = this.getView().byId("ThemeCombobox").getSelectedKey();
			this.SelectedTheme = this.getView().byId("ThemeCombobox").getSelectedKey();

			var aFilters = [new Filter("Theme", sap.ui.model.FilterOperator.EQ, sKey)];
			this.getView().getModel().read("/TemplateSet", {
				filters: aFilters,
				success: function (oData) {
					var oCombobox = this.getView().byId("TemplateCombobox");
					oCombobox.setSelectedKey("");
					oCombobox.removeAllItems();
					for (var i = 0; i < oData.results.length; i++) {
						var oItem = new sap.ui.core.ListItem({
							key: oData.results[i].TemplateCode,
							text: oData.results[i].TemplateDesc,
							additionalText: oData.results[i].Process
						});
						oCombobox.addItem(oItem)
					}
					oCombobox.setBusy(false)
				}.bind(this)
			})
		},
		onTemplateSelectionChange: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var sKey = oEvent.getSource().getSelectedKey();
			var additionalText = oEvent.getSource().getSelectedItem().getAdditionalText();
			var Path = this.getView().getBindingContext().getPath();
			this.SelectedTemplate = this.getView().byId("TemplateCombobox").getSelectedKey();
			this.getView().getModel().setProperty(Path + "/DpoType", additionalText);

			if (additionalText == 'P-CENTR') {
				// "Centrální projednání" 
				this.getView().getModel().setProperty(Path + "/ProcessDesc", this.getResourceBundle().getText("centrallyDiscussed"));
			} else if (additionalText == 'D-DOHODA') {
				// dohody
				this.getView().getModel().setProperty(Path + "/ProcessDesc", this.getResourceBundle().getText("agreements"));
			}

			this.getView().getModel().read("/LongTextSet('" + sKey + "')", {
				success: function (oData) {
					this.oResult = oData;
					setTimeout(function () {
						var Path = this.getView().getBindingContext().getPath();
						this.getView().getModel().setProperty(Path + "/Url", this.oResult.Url);
						var e = this.getView().byId("NameOfRequest");
						e.setValue(this.oResult.Subject);
						e = this.getView().byId("RequestLongText");
						e.setValue(this.oResult.ReqLongText);
						e = this.getView().byId("UrlToTemplate");
					}.bind(this), 0)
				}.bind(this)
			})
		},
		_saveData: function (bForce) {
			var oModel = this.getOwnerComponent().getModel();
			var oDeferred = $.Deferred();
			$.sap.delayedCall(0, null, function () {
				if (!oModel) {
					return false
				}
				if (!oModel.hasPendingChanges()) {
					oDeferred.resolve()
				} else {
					sap.ui.core.BusyIndicator.show(2e3);
					oModel.submitChanges({
						success: (oData, oResponse) => {
							oDeferred.resolve(oData)
						},
						error: function () {
							oDeferred.reject()
						}
					});
					oDeferred.always(function () {
						sap.ui.core.BusyIndicator.hide()
					})
				}
			});
			return oDeferred.promise()
		},
		onCreatePress: function () {
			this.setSelectedItemsDropdown();
			if (this.getView().byId("TemplateCombobox").getSelectedKey() == "" || this.getView().byId("ThemeCombobox").getSelectedKey() == "") {
				var sMsg = this.getModel("i18n").getProperty("ThemeOrTemplateNotFilled");
				sap.ui.getCore().getMessageManager().removeAllMessages();
				sap.m.MessageBox.error(sMsg);
				return
			}
			this.saveData().then(function () {
				this.getView().getModel().callFunction("/Save", {
					method: "GET",
					urlParameters: {
						DpoRequest: this._RequestId,
						NextStatus: "",
						Clarification: "",
						button_press: "SaveAsDraft",
						actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
							"/Deputy/uname")
					},
					success: function (oData) {
						this.CreatedFlag = true;
						this.getModel("appModel").setProperty("/createdFlag", this.CreatedFlag);
						this.getView().getElementBinding().refresh(true)
						sap.ui.getCore().getMessageManager().removeAllMessages();
						var sMsg = this.getModel("i18n").getProperty("draftSaved");
						sap.m.MessageToast.show(sMsg)
					}.bind(this),
					error: function (oError) {
						this.getView().getElementBinding().refresh(true)
						var sMsg = "Nastala chyba p�i ukl�d�n� ��dosti.";
						sap.m.MessageToast.show(sMsg)
						sap.ui.getCore().getMessageManager().removeAllMessages();
					}.bind(this)
				})
			}.bind(this))
		},
		onCreatePress1: function () {
			this.setSelectedItemsDropdown();
			sap.ui.getCore().getMessageManager().removeAllMessages();
			if (this.getView().byId("TemplateCombobox").getSelectedKey() == "" || this.getView().byId("ThemeCombobox").getSelectedKey() == "") {
				var sMsg = this.getModel("i18n").getProperty("ThemeOrTemplateNotFilled");
				sap.m.MessageBox.error(sMsg);
				return
			}
			this.saveData().then(function () {
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
								this.getModel("appModel").setProperty("/createdFlag", this.CreatedFlag);
								this.getView().getElementBinding().refresh(true);
								var sMsg = "Odesl�no ke schv�len�.";
								sap.m.MessageToast.show(sMsg);
								this.navBackToMaster()
							}.bind(this),
							error: function (oError) {
								this.getView().getElementBinding().refresh(true)
								var sMsg = "Chyba p�i odesl�n� ��dosti.";
								sap.m.MessageToast.show(sMsg)
							}.bind(this)
						})
					} else {
						this.getView().getModel().callFunction("/Save", {
							method: "GET",
							urlParameters: {
								DpoRequest: this._RequestId,
								NextStatus: "",
								Clarification: "",
								button_press: "SaveAsDraft",
								actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
									"/Deputy/uname")
							},
							success: function (oData) {
								this.CreatedFlag = true;
								this.getModel("appModel").setProperty("/createdFlag", this.CreatedFlag);
								this.getView().getElementBinding().refresh(true)
								sap.ui.getCore().getMessageManager().removeAllMessages();
								var sMsg = this.getModel("i18n").getProperty("draftSaved");
								sap.m.MessageToast.show(sMsg)
							}.bind(this),
							error: function (oError) {
								this.getView().getElementBinding().refresh(true)
							}.bind(this)
						})
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
							this.getModel("appModel").setProperty("/createdFlag", this.CreatedFlag);
							this.getView().getElementBinding().refresh(true);
							var sMsg = "Odesl�no ke schv�len�.";
							sap.m.MessageToast.show(sMsg);
							this.navBackToMaster()
						}.bind(this),
						error: function (oError) {
							this.getView().getElementBinding().refresh(true)
							var sMsg = "Chyba p�i odesl�n� ��dosti.";
							sap.m.MessageToast.show(sMsg)
						}.bind(this)
					})
				}
			}.bind(this))
		},

		onBeforeUploadStarts: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();

			for (var i = 0; i < this.getView().byId("UploadCollection").getItems().length; i++) {
				if (this.getView().byId("UploadCollection").getItems()[i].getProperty("fileName") == oEvent.getParameter("fileName")) {
					var pom = this.getModel("i18n").getProperty("ThemeOrTemplateNotFilled");
					pom = "P��loha m� stejn� n�zev jako ji� existuj�c� p��loha. Nahr�n� p��lohy bylo zastaveno.";
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
		onUploadComplete: function (oEvent) {
			var oUploadCollection = this.getView().byId("UploadCollection");
			oUploadCollection.getBinding("items").refresh()
		},
		onFileDeleted: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var sDocId = oEvent.getParameter("documentId");
			this.getView().getModel().remove(oEvent.getParameter("item").getBindingContext().getPath(), {
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
		openCreateAdditionalRequestorDialog: function (oEvent) {
			var oView = this.getView();
			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_DPO_REQUEST.fragment.AddRequestor",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog
				})
			}
			this._pDialog.then(function (oDialog) {
				this.getView().byId("SelectedPersonDeputy").setValue("");
				oDialog.open()
			}.bind(this))
		},
		openUpdateAdditionalRequestorDialog: function (oEvent) {
			this.ChangeDeputyBindingPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
			var oView = this.getView();
			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_DPO_REQUEST.fragment.AddRequestor",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog
				})
			}
			this._pDialog.then(function (oDialog) {
				oDialog.bindElement(this.ChangeDeputyBindingPath);
				oDialog.open()
			}.bind(this))
		},
		openDeleteAdditionalRequestorDialog: function (oEvent) {
			this.DeleteDeputyBindingPath = oEvent.getSource().getBindingContext().getPath();
			if (!this.oDeleteAddtionalRequestorDialog) {
				var t1 = this.getModel("i18n").getProperty("removeAnotherRequestor");
				var t2 = this.getModel("i18n").getProperty("removeAnotherRequesterText");
				var t3 = this.getModel("i18n").getProperty("save");
				var t4 = this.getModel("i18n").getProperty("close");
				this.oDeleteAddtionalRequestorDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: t1,
					content: new sap.m.Text({
						text: t2
					}),
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: t3,
						press: function (oEvent) {
							this.onSumbitDeleteAddtionalRequestor(oEvent)
						}.bind(this)
					}),
					endButton: new sap.m.Button({
						text: t4,
						press: function () {
							this.oDeleteAddtionalRequestorDialog.close()
						}.bind(this)
					})
				})
			}
			this.oDeleteAddtionalRequestorDialog.open()
		},
		onSumbitDeleteAddtionalRequestor: function (oEvent) {
			this.DeleteDeputyBindingPath = this.DeleteDeputyBindingPath.replace('OtherApproversCopySet', 'OtherApproversSet')
			this.getView().getModel().remove(this.DeleteDeputyBindingPath, {
				method: "DELETE",
				success: function (oData) {
					var sMsg = this.getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(sMsg);
					this.getView().byId("OtherRequestorsTable").getBinding().refresh();
					this.oDeleteAddtionalRequestorDialog.close()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error.";
					sap.m.MessageToast.show(oError);
					this.getView().setBusy(false)
				}
			})
		},
		onValueHelpPersonChosen: function (oEvent) {
			this.byId("SelectedPersonDeputy").setValue(oEvent.getParameter("selectedItem").getTitle());
			this.NextPersonPernr = oEvent.getParameter("selectedItem").getNumberUnit();
			this.byId("SelectedPersonDeputy").fireLiveChange();
			oEvent.getSource().destroy()
		},
		onValueHelpClose: function (oEvent) {
		},
		onCreateAdditionalRequestor: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var sRole = this.byId("RoleDeputySelection").getSelectedKey();
			this.DialogToClose = oEvent.getSource().getParent();

			var NextPersonPernr = this.NextPersonPernr;
			this.NextPersonPernr = null;

			if (NextPersonPernr == "" || NextPersonPernr == null || sRole == "") {
				sap.m.MessageBox.error("Nebyla zvolena osoba.");
				return;
			}
			this.getView().getModel().create(this.getView().getBindingContext().getPath() + "/OtherApproversSet", {
				Pernr: NextPersonPernr,
				Role: sRole,
				ZadUnameForZadNext: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
					"/Deputy/uname")
			}, {
				success: function (oData) {
					var sMsg = this.getModel("i18n").getProperty("saved");
					this.getView().byId('OtherRequestorsTable').getBinding().refresh();
					sap.m.MessageToast.show(sMsg);
					this.DialogToClose.close()
				}.bind(this),
				error: function (oError) {
					var sMsg = JSON.parse(oError.responseText).error.innererror.errordetails[0].message
					sap.m.MessageToast.show(sMsg);
					this.getView().setBusy(false)
				}.bind(this)
			})
		},
		onPeopleValueHelpRequest: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var sValue = oEvent.getSource().getValue(),
				oView = this.getView();
			var sRole = this.byId("RoleDeputySelection").getSelectedKey();
			var sRequestId = this._RequestId;
			this._pValueHelpDialog = Fragment.load({
				id: oView.getId(),
				name: "ZHR_DPO_REQUEST.fragment.PeopleValueHelp",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				return oDialog
			});
			this._pValueHelpDialog.then(function (oDialog) {
				var oFilter = new Filter({
					filters: [new Filter("Pernr", FilterOperator.EQ, sValue), new Filter("Uname", FilterOperator.EQ, sValue), new Filter("Fullname", FilterOperator.EQ, sValue), new Filter("Role", FilterOperator.EQ, sRole), new Filter(
						"DpoRequest", FilterOperator.EQ, sRequestId)],
					and: true
				});
				oDialog.open(sValue)
			})
		},
		onValuePersonHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var sRole = this.byId("RoleDeputySelection").getSelectedKey();
			var sRequestId = this._RequestId;
			var oFilter = new Filter({
				filters: [new Filter("Pernr", FilterOperator.EQ, sValue), new Filter("Uname", FilterOperator.EQ, sValue), new Filter("Fullname", FilterOperator.EQ, sValue), new Filter("Role", FilterOperator.EQ, sRole), new Filter(
					"DpoRequest", FilterOperator.EQ, sRequestId)],
				and: true
			});
			oEvent.getSource().getBinding("items").filter(oFilter)
		},
		onRoleChange: function (oEvent) {
			this.byId("SelectedPersonDeputy").setValue("")
		},
		handleChange: function (oEvent) {
			var oControl = oEvent.getSource(),
				sKey = oControl.getSelectedKey(),
				sValue = oControl.getValue();
			if (!sKey) {
				oControl.setValueState(sap.ui.core.ValueState.Error);
				oControl.setValueStateText("Please enter a valid value!")
			} else {
				oControl.setValueState(sap.ui.core.ValueState.None)
			}
		},
		onSortCoCreators: function (oEvent) {
			this.saveData().then(function () {
				this.getView().getModel().callFunction("/Save", {
					method: "GET",
					urlParameters: {
						DpoRequest: this._RequestId,
						NextStatus: "",
						Clarification: "",
						button_press: "SaveOnly",
						actual_user: this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty(
							"/Deputy/uname")
					},
					success: function (oData) {
						this.CreatedFlag = true;
						this.getModel("appModel").setProperty("/createdFlag", this.CreatedFlag);
						this.getView().getElementBinding().refresh(true)
						var sMsg = this.getModel("i18n").getProperty("draftSaved");
						sap.m.MessageToast.show(sMsg)

						this.ElementBindingView = this.getView().getBindingContext().getPath();
						var oView = this.getView();
						if (!this._sortCoCreators) {
							this._sortCoCreators = Fragment.load({
								id: oView.getId(),
								name: "ZHR_DPO_REQUEST.fragment.SortCoCreators",
								controller: this
							}).then(function (oDialog) {
								oView.addDependent(oDialog);
								return oDialog
							})
						}
						this._sortCoCreators.then(function (oDialog) {
							this.onForceSort();
							oDialog.bindElement(this.ElementBindingView);
							oDialog.open()
						}.bind(this))
					}.bind(this),
					error: function (oError) {
						this.getView().getElementBinding().refresh(true)
						var sMsg = "Nastala chyba p�i ukl�d�n� ��dosti.";
						sap.m.MessageToast.show(sMsg)
					}.bind(this)
				})
			}.bind(this))
		},

		onCloseDialogResetChanges: function (oEvent) {
			oEvent.getSource().getParent().close();
			this.getView().getModel().resetChanges();
			this.NextPersonPernr = null;

			this.setSelectedItemsDropdown();
		},

		setSelectedItemsDropdown: function () {
			var Path = this.getView().getBindingContext().getPath();
			this.getView().getModel().setProperty(Path + "/Theme", this.SelectedTheme);
			this.getView().getModel().setProperty(Path + "/TemplateCode", this.SelectedTemplate);
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
		},
		sortPointsOfDiscusion: function (iDragIndex, iDropIndex, oTable) {
			if (iDragIndex > iDropIndex) {
				for (var n = iDragIndex; n > iDropIndex; n--) {
					var sPath = oTable.getItems()[n].getBindingContext().sPath;
					var sDeepPath = oTable.getItems()[n].getBindingContext().sDeepPath;
					oTable.getItems()[n].getBindingContext().sPath = oTable.getItems()[n - 1].getBindingContext().sPath;
					oTable.getItems()[n].getBindingContext().sDeepPath = oTable.getItems()[n - 1].getBindingContext().sDeepPath;
					oTable.getItems()[n - 1].getBindingContext().sPath = sPath;
					oTable.getItems()[n - 1].getBindingContext().sDeepPath = sDeepPath
				}
			} else {
				for (var n = iDragIndex; n < iDropIndex; n++) {
					var sPath = oTable.getItems()[n].getBindingContext().sPath;
					var sDeepPath = oTable.getItems()[n].getBindingContext().sDeepPath;
					oTable.getItems()[n].getBindingContext().sPath = oTable.getItems()[n + 1].getBindingContext().sPath;
					oTable.getItems()[n].getBindingContext().sDeepPath = oTable.getItems()[n + 1].getBindingContext().sDeepPath;
					oTable.getItems()[n + 1].getBindingContext().sPath = sPath;
					oTable.getItems()[n + 1].getBindingContext().sDeepPath = sDeepPath
				}
			}
		},
		recalculateOrderNumbersPointfOfDiscussions: function (oEvent) {
			var sOrderNr = "";
			var oTable = this.getView().byId("SortCoCreatorsTable");
			for (var n = 0; n < oTable.getItems().length; n++) {
				if (n < 9) sOrderNr = "00" + (n + 1);
				else if (n < 99) sOrderNr = "0" + (n + 1);
				else sOrderNr = n + 1;
				oTable.getModel().setProperty("Ordernr", sOrderNr, oTable.getItems()[n].getBindingContext())
			}
		},
		onSortingSuccess: function (oEvent) {
			this.setSelectedItemsDropdown();
			oEvent.getSource().getParent().close();
			var oModel = this.getOwnerComponent().getModel();
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
					this.reloadOtherRequestors();
				}.bind(this))
			}
		},

		reloadOtherRequestors: function (oEvent) {
			var oTable = this.getView().byId("OtherRequestorsTable");
			oTable.getBinding("rows").refresh(true);
		},

		onChangeTermToRequestPress: function (oEvent) {
			this.ElementBindingView = this.getView().getBindingContext().getPath();
			var oView = this.getView();
			this._changeTermOfRequestDialog = Fragment.load({
				id: oView.getId(),
				name: "ZHR_DPO_REQUEST.fragment.ChangeTermOfRequest",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				return oDialog
			});
			this._changeTermOfRequestDialog.then(function (oDialog) {
				oDialog.bindElement(this.ElementBindingView);
				oDialog.open()
			}.bind(this))
		},
		onTermValueHelpPress: function (oEvent) {
			var sValue = oEvent.getSource().getValue(),
				oView = this.getView();
			if (!this._requestValueHelpDialog) {
				this._requestValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_DPO_REQUEST.fragment.TermValueHelp",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog
				})
			}
			this._requestValueHelpDialog.then(function (oDialog) {
				var sDate = new Date().toISOString().slice(0, 10).replaceAll('-', '');
				oDialog.getBinding("items").filter([new Filter("TermSp", sap.ui.model.FilterOperator.GE, sDate)]);
				oDialog.open();
			})
		},
		onValueHelpTermChosen: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			this.byId("TermIdAddTermDialogDate").setValue(oSelectedItem.getTitle());
			this.byId("TermIdAddTermDialogID").setValue(oSelectedItem.getNumberUnit());
		},
		onTermValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oView = this.getView();
			this._requestValueHelpDialog.then(function (oDialog) {
				var oDate = new Date();
				var oDateFormat = DateFormat.getInstance({ pattern: "yyyy-MM-dd" });
				var sFormattedDate = oDateFormat.format(oDate);
				var FilterTerm = new Filter({
					filters: [new Filter("TermSp", sap.ui.model.FilterOperator.GE, sFormattedDate), new Filter("Location", sap.ui.model.FilterOperator.Contains, sValue),
						new Filter("StatusDesc", sap.ui.model.FilterOperator.Contains, sValue), new Filter("ProcessDesc", sap.ui.model.FilterOperator.Contains, sValue),
						new Filter("UnionOrg", sap.ui.model.FilterOperator.Contains, sValue)
					],
					and: false
				});
				oDialog.getBinding("items").filter(FilterTerm)
			})
		},
		onChangeTermOfRequestialogSuccess: function (oEvent) {
			var sTermId = this.byId("TermIdAddTermDialog").getValue();
			this.DialogToClose = oEvent.getSource().getParent();
			this.getView().getModel().callFunction("/ChangeTermOnRequest", {
				method: "GET",
				urlParameters: {
					DpoRequest: this._RequestId,
					TermId: sTermId
				},
				success: function (oData, oResponse) {
					this.getView().getElementBinding().refresh();
					var sMsg = "next step success.";
					sap.m.MessageToast.show(sMsg);
					this.DialogToClose.destroy()
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})
		},

		onForceSort: function () {
			var Table = this.getView().byId("SortCoCreatorsTable");

			for (var i = 0; i < Table.getItems().length - 1; i++) {
				var sPath = Table.getItems()[i].getBindingContext().sPath;
				var sDeepPath = Table.getItems()[i].getBindingContext().sDeepPath;
				var Index = parseInt(this.getModel().getData(sPath).Ordernr);

				if (Index == i + 1 || Index == 999) {

					continue;
				}

				Table.getItems()[i].getBindingContext().sPath = Table.getItems()[Index - 1].getBindingContext().sPath;
				Table.getItems()[i].getBindingContext().sDeepPath = Table.getItems()[Index - 1].getBindingContext().sDeepPath;
				Table.getItems()[Index - 1].getBindingContext().sPath = sPath;
				Table.getItems()[Index - 1].getBindingContext().sDeepPath = sDeepPath
			}
			Table.getBinding("items").refresh();
		},
		onFilenameLengthExceed: function (oEvent) {

		},

	})
});