sap.ui.define([
	"ZHR_DPO_REQUEST/lib/controller/Base.controller",
	"sap/ui/core/Fragment",
	'sap/base/util/deepExtend',
	'sap/ui/model/json/JSONModel',
	"sap/m/library",
	"sap/ui/table/RowAction",
	"sap/ui/table/RowActionItem",
	"sap/ui/model/Filter"
], function (Controller, Fragment, deepExtend, JSONModel, mobileLibrary, RowAction, RowActionItem, Filter) {
	"use strict";

	var createModel = new JSONModel({});
	// shortcut for sap.m.ButtonType
	var ButtonType = mobileLibrary.ButtonType;

	// shortcut for sap.m.DialogType
	var DialogType = mobileLibrary.DialogType;
	return Controller.extend("ZHR_DPO_REQUEST.controller.Base", {
		onInit: function () {
			this.getView().setModel(createModel, "createModel");

			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("a004fromdetail").attachPatternMatched(this._onPatternMatchedA004FromDetail, this);
			this._oRouter.getRoute("a004fromcreate").attachPatternMatched(this._onPatternMatchedA004FromCreate, this);
		},

		testingPurpose: function () {
			var fnPress = this.fnPress.bind(this);
			var fnPressDetail = this.onItemPressed.bind(this);
			var fnPressUpdate = this.onEditPress.bind(this);
			var fnPressDelete = this.onDeleteItemPressed.bind(this);
			var that = this;
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
								press: fnPressDelete,
								visible: "{= ${appModel>/A004RequestSettings/RequestEditO} === 'true' " +
										"&& ${appModel>/A004ReadOnly} !== true " +
										"&& (${appModel>/A004RequestSettings/AddAttachmentO} !== 'true' || ${A004>NotYetApproved}) }"
							}),
							new RowActionItem({
								icon: "sap-icon://edit",
								text: "Upravit",
								press: fnPressUpdate,
								visible: "{= ${appModel>/A004RequestSettings/RequestEditO} === 'true' " +
										"&& ${appModel>/A004ReadOnly} !== true " +
										"&& (${appModel>/A004RequestSettings/AddAttachmentO} !== 'true' || ${A004>NotYetApproved}) }"
							})
						]
					});
					return [2, oTemplate];
				}.bind(this)
			}];
			this.switchState("NavigationDelete");
		},

		getBoolFromString: function (oInput) {
			if (oInput == 'true') {
				return true;
			} else return false;
		},

		_filterVersionComboBox: function () {
			var oComboBox = this.byId("VersionComboBox");
			if (oComboBox) {
				var oBinding = oComboBox.getBinding("items");
				if (oBinding) {
					var sUname = this.getModel("appModel").getProperty("/Deputy/uname");
					var aFilters = [new Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId)];
					aFilters.push(new Filter("JmenoPrijmeni03", sap.ui.model.FilterOperator.EQ, sUname || ""));
					oBinding.filter(aFilters);

					oBinding.attachEventOnce("dataReceived", function () {
						var aItems = oComboBox.getItems();
						if (aItems.length > 0) {
							oComboBox.setSelectedItem(aItems[0]);
							this.onVersionChange();
						}
					}, this);
				}
			}
		},

		onVersionChange: function (oEvent) {
			var sKey = this.byId("VersionComboBox").getSelectedKey();
			var oTable = this.byId("MainTable");
			var oBinding = oTable.getBinding("rows");
			if (oBinding) {
				var sUname = this.getModel("appModel").getProperty("/Deputy/uname");
				var aFilter = new sap.ui.model.Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId);
				var uFilter = new sap.ui.model.Filter("JmenoPrijmeni03", sap.ui.model.FilterOperator.EQ, sUname == undefined ? "" : sUname);
				var aFilters = [aFilter, uFilter];
				if (sKey) {
					aFilters.push(new sap.ui.model.Filter("Version", sap.ui.model.FilterOperator.EQ, sKey));
				}
				var Filters = new sap.ui.model.Filter({
					filters: aFilters,
					and: true
				});
				oBinding.filter([Filters]);
			}
		},

		onNavBack: function () {
			var i = this.getOwnerComponent().getEventBus();
			i.publish("reloadRequestDetail");
			this._Refresh = this.utf8_to_b64(this._Refresh);
			this.getRouter().navTo(this._navTo, {
					RequestId: this._RequestId,
					Refresh: this._Refresh
				}, true)
		},

		fnPress: function (sKey) {},

		_onPatternMatchedA004FromCreate: function (e) {

			var n = e.getParameter("arguments");
			this._RequestId = n.RequestId;
			this._Refresh = this.b64_to_utf8(n.Refresh);
			this._navTo = "update";

			this.getView().getModel("appModel").setProperty("/A004ReadOnly", false);
			this.getModel().read("/CreatorSet", {
				success: function (e) {
					var t = {
						uname: '',
						fullname: ''
					};
					for (var i = 0; i < e.results.length; i++) {
						if (e.results[i].CreatorUname == this._Refresh) {
							t = {
								uname: e.results[i].CreatorUname,
								fullname: e.results[i].CreatorFullName
							};
							break;
						}
					}
					this.getModel("appModel").setProperty("/Deputy", t);
					this.doTheBinding(e);
				}.bind(this)
			});
		},

		_onPatternMatchedA004FromDetail: function (e) {

			var n = e.getParameter("arguments");
			this._RequestId = n.RequestId;
			this._Refresh = this.b64_to_utf8(n.Refresh);
			this._navTo = "detail";

			this.getView().getModel("appModel").setProperty("/A004ReadOnly", true);

			this.getModel().read("/CreatorSet", {
				success: function (e) {
					var t = {
						uname: '',
						fullname: ''
					};
					for (var i = 0; i < e.results.length; i++) {
						if (e.results[i].CreatorUname == this._Refresh) {
							t = {
								uname: e.results[i].CreatorUname,
								fullname: e.results[i].CreatorFullName
							};
							break;
						}
					}
					this.getModel("appModel").setProperty("/Deputy", t);
					this.doTheBinding(e);
				}.bind(this)
			});
		},

		doTheBinding: function (e) {
			this._filterVersionComboBox();
			var aFilter = new sap.ui.model.Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId);
			var uFilter = new sap.ui.model.Filter("JmenoPrijmeni03", sap.ui.model.FilterOperator.EQ, this.getModel("appModel").getProperty("/Deputy/uname") == undefined ? "" : this.getModel("appModel").getProperty("/Deputy/uname"));
			var sVersion = this.byId("VersionComboBox").getSelectedKey();
			var aFilters = [aFilter, uFilter];
			if (sVersion) {
				aFilters.push(new sap.ui.model.Filter("Version", sap.ui.model.FilterOperator.EQ, sVersion));
			}
			var Filters = new sap.ui.model.Filter({
				filters: aFilters,
				and: true
			});
			this.getView().byId("MainTable").bindRows({
				path: "A004>/ItemSet"
			});
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");

			this.getModel().read("/AuthStrucSet(DpoRequest='" + this._RequestId + "',Uname='" + this.getModel("appModel").getProperty(
				"/Deputy/uname") + "')", {
				success: oData => {
					this.getModel("appModel").setProperty("/A004RequestSettings", oData)
					this.testingPurpose();
				}
			});

			this.getView().getModel("A004").callFunction("/CreateOrGet", {
				method: "POST",
				urlParameters: {
					Request: this._RequestId,
					Uname: Uname
				},
				success: function (oData, oResponse) {
					var Pom = {
						DpoRequest: oData.DpoRequest,
						CreatedAt: oData.CreatedAt,
						ExtEditFl: oData.ExtEditFl,
						ShowA004PdfFl: oData.ShowA004PdfFl
					}
					this.getView().getModel("appModel").setProperty("/A004Settings", Pom);
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show(oError)
				}.bind(this)
			})

			this.getView().byId("MainTable").getBinding("rows").filter([Filters]);
		},
		onPress: function (oEvent) {
			var aFilter = new sap.ui.model.Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, this._RequestId);
			this.getView().byId("MainTable").bindRows({
				path: "A004>/ItemSet"
			});

			this.getView().byId("MainTable").getBinding("rows").filter([aFilter]);
		},

		switchState: function (sKey) {
			var oTable = this.byId("MainTable");
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

		onDataReceivedMasterTable: function (oEvent) {
		},

		rebindTable: function (oTemplate, sKeyboardMode) {
			this.getView().byId("table2").bindItems({
				path: "/ItemSet",
				template: oTemplate
			}).setKeyboardMode(sKeyboardMode);

			var aFilter = new sap.ui.model.Filter("DpoRequest", sap.ui.model.FilterOperator.EQ, '1');

			this.getView().byId("table2").getBinding("items").filter([aFilter]);
		},

		onEdit: function () {
			this.oReadOnlyTemplate = this.byId("table2").removeItem(0);
			this.aProductCollection = deepExtend([], this.getView().getModel("A004").getProperty("/ItemSet"));
			this.byId("editButton").setVisible(false);
			this.byId("saveButton").setVisible(true);
			this.byId("cancelButton").setVisible(true);
			this.rebindTable(this.oEditableTemplate, "Edit");
		},

		onSave: function () {
			this.saveData("A004");
			this.byId("saveButton").setVisible(false);
			this.byId("cancelButton").setVisible(false);
			this.byId("editButton").setVisible(true);
			this.rebindTable(this.oReadOnlyTemplate, "Navigation");
		},

		onCancel: function () {
			this.byId("cancelButton").setVisible(false);
			this.byId("saveButton").setVisible(false);
			this.byId("editButton").setVisible(true);
			this.rebindTable(this.oReadOnlyTemplate, "Navigation");
		},

		onPdfPress: function (oEvent) {
			var oLink = document.createElement("a");
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			oLink.setAttribute("href", "/sap/opu/odata/sap/ZHR_DPO_A004_SRV/PdfSet(DpoRequest='" + this._RequestId + "')/$value/?Uname=" + Uname);
			oLink.setAttribute("download", this._RequestId + "-internal.pdf");
			document.body.appendChild(oLink);
			oLink.click();
			document.body.removeChild(oLink);
		},

		onChange1: function (oEvent) {
			this.tryToInit("1");
			this.getView().getModel("A004").callFunction("/GetFmByPernr", {
				method: "GET",
				urlParameters: {
					Request: this._RequestId,
					Pernr: oEvent.getParameter("newValue")
				},
				success: function (oData, oResponse) {
					this.getView().byId("pom").setValue(oData.NazevPozice + '/' + oData.JmenoPrijmeni + '/' + oData.Pernr);
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError);
				}.bind(this)
			});
		},
		onChange2: function (oEvent) {
		},
		tryToInit: function (Request) {
			this.getView().getModel("A004").callFunction("/RequestItems", {
				method: "GET",
				urlParameters: {
					Request: Request
				},
				success: function (oData, oResponse) {
					this.getView().byId("pom").setValue(oData.NazevPozice + '/' + oData.JmenoPrijmeni + '/' + oData.Pernr);
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError);
				}.bind(this)
			});
		},
		onCreatePress: function (oEvent) {
			var View = this.getView();
			var pom = this.getView().getModel("createModel");
			for (var [key, value] of Object.entries(pom.oData)) {
				pom.oData[`${key}`] = "";
			}
			this._pDialog = Fragment.load({
				id: View.getId(),
				name: "ZHR_DPO_REQUEST.fragment.A004CreateEntry",
				controller: this
			}).then(function (Event) {
				View.addDependent(Event);
				return Event;
			});

			this._pDialog.then(function (Event) {
				sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel({}), "createModel");
				Event.open();
			}.bind(this));
		},

		onCreateConfirmPress: function (oEvent) {
			var Count = this.getView().byId("MainTable").getBindingInfo("rows").binding.getCount();
			var Pernr = this.getView().getModel("createModel").getProperty("/Pernr");
			for (var i = 0; i < Count; i++) {
				this.getView().byId("MainTable").getContextByIndex(i).getObject()
				if (this.getView().byId("MainTable").getContextByIndex(i).getObject().Pernr == Pernr) {
					var sMsg = this.getModel("i18n").getProperty("duplicatePernrA004");
					sap.m.MessageBox.error(sMsg);
					return;
				}
			};

			createModel.setProperty("/DpoRequest", this._RequestId);
			var Pom = createModel.getData()

			if (!Pom.AttachItemType || !Pom.Cinnosti || !Pom.Opatreni || !Pom.OpatreniDetail || !Pom.Pernr || !Pom.Procent || !Pom.ReseniNavrh ||
				!Pom.TerminZruseni || !Pom.Fm03) {
				var sMsg = this.getModel("i18n").getProperty("mandatoryFieldsNotFilled");
				sap.m.MessageBox.error(sMsg);
				return;
			}
			if (Pom.AttachItemType == "" || Pom.Cinnosti == "" || Pom.Opatreni == "" || Pom.OpatreniDetail == "" || Pom.Pernr == "" || Pom.Procent ==
				"" || Pom.ReseniNavrh == "" || Pom.TerminZruseni == "" || Pom.Fm03 == "") {
				var sMsg = this.getModel("i18n").getProperty("mandatoryFieldsNotFilled");
				sap.m.MessageBox.error(sMsg);
				return;
			}

			var dateString = Pom.TerminZruseni;
			var year = dateString.substring(0, 4);
			var month = dateString.substring(4, 6);
			var day = dateString.substring(6, 8);

			var date = new Date(year, month - 1, day);
			var currentDate = new Date();
			var currentDatePlusYear = new Date(new Date().setFullYear(new Date().getFullYear() + 10));

			if (date < currentDate) {
				var sMsg = this.getModel("i18n").getProperty("termInTheHistory");
				sap.m.MessageBox.error(sMsg);
				return;
			} else if (date > currentDatePlusYear) {
				var sMsg = this.getModel("i18n").getProperty("termTooMuchInFuture");
				sap.m.MessageBox.error(sMsg);
				return;
			}

			var that = oEvent;
			this.getView().getModel("A004").create("/ItemSet", Pom, {
				success: function (oData) {
					var sMsg = this.getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(sMsg);
					this.getView().byId("CreateA004Dialog").destroy();
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show(oError);
				}.bind(this),
			})
		},

		onDeleteItemPressed: function (oEvent) {
			var View = this.getView();
			this.ElementBindingView = oEvent.getSource().getBindingContext("A004").getPath();
			if (!this._deleteDialog) {
				this._deleteDialog = Fragment.load({
					id: View.getId(),
					name: "ZHR_DPO_REQUEST.fragment.A004DeleteEntry",
					controller: this
				}).then(function (Event) {
					View.addDependent(Event);
					return Event;
				});
			}
			this._deleteDialog.then(function (Dialog) {
				Dialog.bindElement("A004>" + this.ElementBindingView);
				Dialog.open();
			}.bind(this));
		},

		deleteItemSet: function (oEvent) {
			this.getView().getModel("A004").remove(oEvent.getSource().getBindingContext("A004").getPath(), {
				method: "DELETE",
				success: function (oData) {
					var sMsg = this.getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(sMsg);
					this.getView().byId("DeleteA004Dialog").close();

					if (this.getView().byId("DetailA004Dialog")) {
						this.getView().byId("DetailA004Dialog").close();
					}
				},
				error: function (oError) {
					sap.m.MessageToast.show(oError);
				}
			});
		},

		deleteItemSet2: function (oEvent) {
			this.getView().getModel("A004").remove(oEvent.getSource().getBindingContext("A004").getPath(), {
				method: "DELETE",
				success: function (oData) {
					var sMsg = this.getModel("i18n").getProperty("saved");
					sap.m.MessageToast.show(sMsg);
					this.getView().byId("DeleteA004Dialog").close();

					if (this.getView().byId("DetailA004Dialog")) {
						this.getView().byId("DetailA004Dialog").close();
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show(oError);
				}.bind(this)
			});
		},

		onEditPress: function (oEvent) {
			var View = this.getView();
			this.ElementBindingView = oEvent.getSource().getBindingContext("A004").getPath();
			if (!this._editDialog) {
				this._editDialog = Fragment.load({
					id: View.getId(),
					name: "ZHR_DPO_REQUEST.fragment.A004UpdateEntry",
					controller: this
				}).then(function (Event) {
					View.addDependent(Event);
					return Event;
				});
			}
			this._editDialog.then(function (Dialog) {
				Dialog.bindElement("A004>" + this.ElementBindingView);
				Dialog.open();
			}.bind(this));
		},

		onItemPressed: function (oEvent) {
			var View = this.getView();
			this.ElementBindingView = oEvent.getSource().getBindingContext("A004").getPath();
			if (!this._pDialog1) {
				this._pDialog1 = Fragment.load({
					id: View.getId(),
					name: "ZHR_DPO_REQUEST.fragment.A004DetailEntry",
					controller: this
				}).then(function (Event) {
					View.addDependent(Event);
					return Event;
				});
			}
			this._pDialog1.then(function (Dialog) {
				Dialog.bindElement("A004>" + this.ElementBindingView);
				Dialog.open();
			}.bind(this));
		},

		onUpdateSavePress: function (oEvent) {
			var Path = this.getView().byId("UpdateItemDialog").getBindingContext("A004").getPath();

			var Pom = this.getOwnerComponent().getModel("A004").getData(oEvent.getSource().getBindingContext("A004").getDeepPath());
			if (!Pom.AttachItemType || !Pom.Cinnosti || !Pom.Opatreni || !Pom.OpatreniDetail || !Pom.Pernr || !Pom.Procent || !Pom.ReseniNavrh ||
				!Pom.TerminZruseni || !Pom.Fm03) {
				var sMsg = this.getModel("i18n").getProperty("mandatoryFieldsNotFilled");
				sap.m.MessageBox.error(sMsg);
				return;
			}
			if (Pom.AttachItemType == "" || Pom.Cinnosti == "" || Pom.Opatreni == "" || Pom.OpatreniDetail == "" || Pom.Pernr == "" || Pom.Procent ==
				"" || Pom.ReseniNavrh == "" || Pom.TerminZruseni == "" || Pom.Fm03 == "") {
				var sMsg = this.getModel("i18n").getProperty("mandatoryFieldsNotFilled");
				sap.m.MessageBox.error(sMsg);
				return;
			}

			this.saveData("A004");
			this.onCloseDialog(oEvent);
		},

		getCustomBool: function (oInput) {
			if (oInput == true) {
				return "X"
			} else {
				return "";
			}
		},

		onFmValueHelpRequest: function (oEvent) {
			var o = this.getView();
			this.personSearchCount=0;
			this._pValueHelpDialogFm = sap.ui.core.Fragment.load({
				id: o.getId(),
				name: "ZHR_DPO_REQUEST.fragment.A004FmValueHelp",
				controller: this
			}).then(function (e) {
				o.addDependent(e);
				return e
			}.bind(this));
			this._pValueHelpDialogFm.then(function (e) {
				e.open()
			})
		},

		onFmValueHelpRequestUpdate: function (oEvent) {
			var o = this.getView();
			this.personSearchCount=0;
			this._pValueHelpDialogFmUpdate = sap.ui.core.Fragment.load({
				id: o.getId(),
				name: "ZHR_DPO_REQUEST.fragment.A004FmValueHelpUpdate",
				controller: this
			}).then(function (e) {
				o.addDependent(e);
				return e
			});
			this._pValueHelpDialogFmUpdate.then(function (e) {
				e.open()
			})
		},

		onFmValueHelpRequestUpdate: function (oEvent) {
			var o = this.getView();
			this.personSearchCount=0;
			this._pValueHelpDialogFm = sap.ui.core.Fragment.load({
				id: o.getId(),
				name: "ZHR_DPO_REQUEST.fragment.A004FmValueHelpUpdate",
				controller: this
			}).then(function (e) {
				o.addDependent(e);
				return e
			}.bind(this));
			this._pValueHelpDialogFm.then(function (e) {
				e.open()
			})
		},

		onPeopleValueHelpRequest: function (oEvent) {
			var o = this.getView();
			this.personSearchCount=0;
			this._pValueHelpDialog = sap.ui.core.Fragment.load({
				id: o.getId(),
				name: "ZHR_DPO_REQUEST.fragment.A004PeopleValueHelp",
				controller: this
			}).then(function (e) {
				o.addDependent(e);
				return e
			}.bind(this));
			this._pValueHelpDialog.then(function (e) {
				e.open()
			})
		},

		onPeopleValueHelpRequestUpdate: function (oEvent) {
			var o = this.getView();
			this.personSearchCount=0;
			this._pValueHelpDialog = sap.ui.core.Fragment.load({
				id: o.getId(),
				name: "ZHR_DPO_REQUEST.fragment.A004PeopleValueHelpUpdate",
				controller: this
			}).then(function (e) {
				o.addDependent(e);		
				return e
			}.bind(this));
			this._pValueHelpDialog.then(function (e) {
				e.open()
			})
		},

		onValueFmHelpSearch: function (oEvent) {
			var SearchString = oEvent.getParameter("value");
			if(SearchString == ""){
				this.personSearchCount=0;
			}
			var Filters1 = new sap.ui.model.Filter({
				filters: [new sap.ui.model.Filter("Plans", sap.ui.model.FilterOperator.EQ, SearchString)
				],
				and: true
			});
			var Filters = null;
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Filters = new sap.ui.model.Filter("Plans", sap.ui.model.FilterOperator.EQ, SearchString);
			} else {
				Filters = [new sap.ui.model.Filter("Plans", sap.ui.model.FilterOperator.EQ, SearchString), new sap.ui.model.Filter("UnitShort", sap.ui
					.model.FilterOperator.EQ, Uname)];
			}

			oEvent.getSource().getBinding("items").filter(Filters);
		},

		onValuePersonHelpSearch: function (oEvent) {
			var SearchString = oEvent.getParameter("value");
			var Filters = new sap.ui.model.Filter({
				filters: [new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, SearchString)],
				and: false
			});

			if(SearchString == ""){
				this.personSearchCount=0;
			}

			var Filters = null;
			var Uname = this.getModel("appModel").getProperty("/Deputy/uname");
			if (Uname == '' || Uname == null || Uname == "SELF") {
				Filters = new sap.ui.model.Filter({
					filters: [new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, SearchString), new sap.ui.model.Filter("Uname", sap.ui
							.model.FilterOperator.EQ, SearchString), new sap.ui.model.Filter("Fullname", sap.ui.model.FilterOperator.EQ, SearchString),
						new sap.ui.model.Filter("Role", sap.ui.model.FilterOperator.EQ, "KONZUL"), new sap.ui.model.Filter("DpoRequest", sap.ui.model
							.FilterOperator
							.EQ, this._RequestId)
					],
					and: true
				})
			} else {
				Filters = new sap.ui.model.Filter({
					filters: [new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, SearchString), new sap.ui.model.Filter("Uname", sap.ui
							.model.FilterOperator.EQ, SearchString), new sap.ui.model.Filter("Fullname", sap.ui.model.FilterOperator.EQ, SearchString),
						new sap.ui.model.Filter("Role", sap.ui.model.FilterOperator.EQ, "KONZUL"), new sap.ui.model.Filter("DpoRequest", sap.ui.model
							.FilterOperator
							.EQ, this._RequestId), new sap.ui.model.Filter("UnitShort", sap.ui
					.model.FilterOperator.EQ, Uname)
					],
					and: true
				})
			}
			oEvent.getSource().getBinding("items").filter(Filters);
		},
		onNewPersonsLoaded: function (oEvent){
			if(this.personSearchCount==0){
				this.personSearchCount++;
				return;
			}
			if(oEvent.getParameter("data").results.length==0){
				var sMsg = this.getModel("i18n").getProperty("personNotFoundInList");
				sap.m.MessageBox.error(sMsg);
			}
		},

		onValueHelpPersonChosen: function (oEvent) {
			this.getView().getModel("A004").callFunction("/GetFmByPernr", {
				method: "GET",
				urlParameters: {
					Request: this._RequestId,
					Pernr: oEvent.getParameter("selectedItem").getNumberUnit()
				},
				success: function (oData, oResponse) {
					this.getView().getModel("createModel").setProperty("/Pernr", oData.Pernr)
					this.getView().getModel("createModel").setProperty("/Fm03", oData.FunkcniMisto)
					this.getView().getModel("createModel").setProperty("/JmenoPrijmeni03", oData.JmenoPrijmeni)
					this.getView().getModel("createModel").setProperty("/NazevPozice03", oData.NazevPozice)
					this.getView().getModel("createModel").setProperty("/Stredisko03", oData.Stredisko)
					this.getView().getModel("createModel").setProperty("/Utvar03", oData.Utvar)
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError);
				}.bind(this)
			});

			oEvent.getSource().destroy()
		},

		onValueHelpPersonChosenUpdate: function (oEvent) {
			this.getView().getModel("A004").callFunction("/GetFmByPernr", {
				method: "GET",
				urlParameters: {
					Request: this._RequestId,
					Pernr: oEvent.getParameter("selectedItem").getNumberUnit()
				},
				success: function (oData, oResponse) {
					var Path = this.getView().byId("UpdateItemDialog").getBindingContext("A004").getPath();

					this.getView().getModel("A004").setProperty(Path + "/Pernr", oData.Pernr)
					this.getView().getModel("A004").setProperty(Path + "/Fm03", oData.FunkcniMisto)
					this.getView().getModel("A004").setProperty(Path + "/JmenoPrijmeni03", oData.JmenoPrijmeni)
					this.getView().getModel("A004").setProperty(Path + "/NazevPozice03", oData.NazevPozice)
					this.getView().getModel("A004").setProperty(Path + "/Stredisko03", oData.Stredisko)
					this.getView().getModel("A004").setProperty(Path + "/Utvar03", oData.Utvar)
				}.bind(this),
				error: function (oError) {
					var sMsg = "Error occured in oData import function getSupervisor.";
					sap.m.MessageToast.show(oError);
				}.bind(this)
			});

			oEvent.getSource().destroy()
		},

		onTermValueHelpPress: function (oEvent) {
			var sValue = oEvent.getSource().getValue(),
				oView = this.getView();
			if (!this._requestValueHelpDialog) {
				this._requestValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_DPO_REQUEST.fragment.TermValueHelp",
					controller: this
				}).then(function (e) {
					oView.addDependent(e);
					return e
				})
			}
			this._requestValueHelpDialog.then(function (e) {
				var sDate = new Date().toISOString().slice(0, 10).replaceAll('-', '');
				e.open();
			})
		},
		onValueHelpTermChosen: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			this.byId("TermDateInput").setValue(oSelectedItem.getTitle());
		},
		onTermValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oView = this.getView();
			this._requestValueHelpDialog.then(function (e) {
				var i = new Date;
				var FilterTerm = new Filter({
					filters: [ new Filter("TermDate", sap.ui.model.FilterOperator.Contains,
							sValue), new Filter("Location", sap.ui.model.FilterOperator.Contains, sValue),
						new Filter("StatusDesc", sap.ui.model.FilterOperator.Contains, sValue), new Filter("ProcessDesc", sap.ui.model.FilterOperator.Contains,
							sValue),
						new Filter("UnionOrg", sap.ui.model.FilterOperator.Contains, sValue)
					],
					and: false
				});
				e.getBinding("items").filter(FilterTerm)
			})
		},
	});
});