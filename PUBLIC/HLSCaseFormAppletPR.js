if (typeof (SiebelAppFacade.HLSCaseFormAppletPR) === "undefined") {

  SiebelJS.Namespace("SiebelAppFacade.HLSCaseFormAppletPR");
  define("siebel/custom/HLSCaseFormAppletPR", ["siebel/phyrenderer", "siebel/custom/vue.js", "siebel/custom/vuetify.js"],
    function () {
      SiebelAppFacade.HLSCaseFormAppletPR = (function () {

        //todo: put in Init and remove in EndLife
        $('head').append('<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons" rel="stylesheet"></link>');
        $('head').append('<link type="text/css"  rel="stylesheet" href="files/custom/vuetify.min.css"/>');
        $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui">');

        function HLSCaseFormAppletPR(pm) {
          SiebelAppFacade.HLSCaseFormAppletPR.superclass.constructor.apply(this, arguments);
        }

        SiebelJS.Extend(HLSCaseFormAppletPR, SiebelAppFacade.PhysicalRenderer);
        var app;
        var divId;
        var n19helper;
        var skipVue = true;
        var appletName;

        // just temp to make it available in Dev Console
        SiebelAppFacade.N19updateSalesRep = function () {
          if (app) {
            app.getSalesRep();
          }
        }
        SiebelAppFacade.N19afterSelection = function () {
          if (app) {
            app.afterSelection();
          }
        }

        HLSCaseFormAppletPR.prototype.Init = function () {
          SiebelAppFacade.HLSCaseFormAppletPR.superclass.Init.apply(this, arguments);

          var viewName = SiebelApp.S_App.GetActiveView().GetName();
          skipVue = viewName.indexOf('List View') === -1;

          if (skipVue) {
            return;
          }

          var pm = this.GetPM();
          pm.AddMethod('InvokeMethod', function (method) {
            console.log('>>> InvokeMethod sequence true', method, arguments);
          }, { sequence: true, scope: this });

          pm.AddMethod('InvokeMethod', function (method) {
            console.log('>>> InvokeMethod sequence false', method, arguments);
          }, { sequence: true, scope: this });

          pm.AddMethod('PostExecute', function (method) {
            console.log('>>> PostExecute sequence true', method, arguments);
          }, { sequence: true, scope: this });

          pm.AddMethod("PostExecute", function (method) {
            console.log('>>> PostExecute sequence false', method, arguments);
          }, { sequence: true, scope: this });

          pm.AttachPostProxyExecuteBinding("ALL", function (method) {
            console.log('>>> AttachPostProxyExecuteBinding', method, arguments);
          });

          // initialize helper
          appletName = pm.Get('GetName');
          SiebelAppFacade.N19 = SiebelAppFacade.N19 || {};
          SiebelAppFacade.N19[appletName] = new SiebelAppFacade.N19Helper({ pm: pm });
          n19helper = SiebelAppFacade.N19[appletName];

          //hide the server rendered html, better to remove, but not now
          divId = "s_" + pm.Get('GetFullId') + "_div";
          document.getElementById(divId).classList.add('siebui-applet', 'siebui-active');
          document.querySelector('#' + divId + ' form').style.display = 'none';
          //document.querySelector('#' + divId + ' form').parentNode.removeChild('form');

          //todo: maybe use applet.prototype.RepopulateField instead of it?
          SiebelAppFacade.N19notifyNewFieldData = SiebelApp.S_App.NotifyObject.prototype.NotifyNewFieldData;
          SiebelApp.S_App.NotifyObject.prototype.NotifyNewFieldData = function (name, value) {
            console.log('>>>>> new field data in notify object', arguments);
            SiebelAppFacade.N19notifyNewFieldData.apply(this, arguments);
            if (app) {
              app.updateFieldData(name, value);
            }
          }

          SiebelAppFacade.N19notifyNewPrimary = SiebelApp.S_App.NotifyObject.prototype.NotifyNewPrimary;
          SiebelApp.S_App.NotifyObject.prototype.NotifyNewPrimary = function () {
            console.log('>>>>> new primary in notify object', arguments);
            SiebelAppFacade.N19notifyNewPrimary.apply(this, arguments);
            if (this.GetAppletRegistry()[0].GetName() === 'Contact Team Mvg Applet') { // todo: change it
              if (app) {
                app.updatePrimary();
              }
            }
          }

          pm.AttachNotificationHandler(consts.get("SWE_PROP_BC_NOTI_GENERIC"), function (propSet) {
            var type = propSet.GetProperty(consts.get("SWE_PROP_NOTI_TYPE"));
            console.log('SWE_PROP_BC_NOTI_GENERIC ', type, propSet);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_ACTIVE_ROW'), function () {
            console.log('>>>SWE_PROP_BC_NOTI_NEW_ACTIVE_ROW', arguments);
            if (app) {
              app.afterSelection();
            }
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_STATE_CHANGED'), function (ps) {
            console.log('SWE_PROP_BC_NOTI_STATE_CHANGED', arguments, ps.GetProperty('state'));
            // do we need 'activeRow'
            if ('activeRow' === ps.GetProperty('state')) {
              console.log('>>>SWE_PROP_BC_NOTI_STATE_CHANGED', arguments);
              if (app) {
                app.afterSelection();
              }
            }
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_DATA_WS'), function (propSet) {
            console.log('SWE_PROP_BC_NOTI_NEW_DATA_WS', arguments);
            var fieldName = propSet.GetProperty(consts.get("SWE_PROP_NOTI_FIELD")); // f
            if (fieldName === 'Sales Rep') {
              console.log('FIELD SALES REP UPDATED', propSet, propSet.childArray[0].GetProperty('ValueArray'));
              if (app) {
                var arr = [];
                CCFMiscUtil_StringToArray(propSet.childArray[0].GetProperty('ValueArray'), arr);
                setTimeout(function () {
                  app.updateSalesRep(arr[0]);
                });
              }
            }
          });

          pm.AttachNotificationHandler(consts.get("SWE_PROP_BC_NOTI_BEGIN"), function () {
            console.log('SWE_PROP_BC_NOTI_BEGIN', arguments);
          });

          pm.AttachNotificationHandler(consts.get("SWE_PROP_BC_NOTI_LONG_OPERATION_PROCESS"), function () {
            console.log('SWE_PROP_BC_NOTI_LONG_OPERATION_PROCESS', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NEW_ACTIVE_FIELD'), function () {
            console.log('SWE_PROP_BC_NEW_ACTIVE_FIELD', arguments);
          });

          pm.AttachNotificationHandler(consts.get("SWE_PROP_BC_NOTI_END"), function () {
            console.log('SWE_PROP_BC_NOTI_END', arguments);
          });

          pm.AttachNotificationHandler(consts.get("SWE_PROP_BC_NOTI_NEW_SELECTION"), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_SELECTION', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_DATA'), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_DATA', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_DELETE_RECORD'), function (propSet) {
            var bSetup = propSet.GetProperty('bSetup');
            console.log('SWE_PROP_BC_NOTI_DELETE_RECORD', arguments, bSetup);

            // in demo called twice, first time bSetup is "true", second time is "false"
            if (bSetup === "false") {
              if (app) {
                app.afterSelection();
              }
            }
            // called twice on undo in demo - because of 2 applets?
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_PRIMARY'), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_PRIMARY', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_INSERT_WORKSET'), function () {
            console.log('SWE_PROP_BC_NOTI_INSERT_WORKSET', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_INSERT_WORKSET_FIELD_VALUES'), function () {
            console.log('SWE_PROP_BC_NOTI_INSERT_WORKSET_FIELD_VALUES', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_EXECUTE'), function () {
            console.log('SWE_PROP_BC_NOTI_EXECUTE', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_CHANGE_SELECTION'), function () {
            console.log('SWE_PROP_BC_NOTI_CHANGE_SELECTION', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_SELECTION_MODE_CHANGE'), function () {
            console.log('SWE_PROP_BC_NOTI_SELECTION_MODE_CHANGE', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_BEGIN_QUERY'), function () {
            console.log('SWE_PROP_BC_NOTI_BEGIN_QUERY', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_QUERYSPEC'), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_QUERYSPEC', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_FIELD_QUERYSPEC'), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_FIELD_QUERYSPEC', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_END_QUERY'), function () {
            console.log('SWE_PROP_BC_NOTI_END_QUERY', arguments);
          });

          pm.AttachNotificationHandler(consts.get("SWE_PROP_BC_NOTI_NEW_RECORD"), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_RECORD', arguments);
            if (app) {
              app.afterSelection();
            }
          });

          pm.AttachNotificationHandler(consts.get("SWE_PROP_BC_NOTI_NEW_RECORD_DATA"), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_RECORD_DATA', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_RECORD_DATA_WS'), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_RECORD_DATA_WS', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_RECORD_SCROLL_DATA'), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_RECORD_SCROLL_DATA', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_PAGE_REFRESH'), function () {
            console.log('SWE_PROP_BC_NOTI_PAGE_REFRESH', arguments);
          });

          pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_NEW_FIELD_DATA'), function () {
            console.log('SWE_PROP_BC_NOTI_NEW_FIELD_DATA', arguments);
          });

          pm.AddMethod("InvokeMethod", this.preInvokeMethod, {
            sequence: true,
            scope: this
          });
        }

        HLSCaseFormAppletPR.prototype.preInvokeMethod = function (methodName, args, lp, returnStructure) {
          SiebelJS.Log(this.GetPM().Get("GetName") + ": HLSCaseFormAppletPR:      preInvokeMethod -  " + methodName);
        }

        HLSCaseFormAppletPR.prototype.ShowUI = function () {
          if (skipVue) {
            SiebelAppFacade.HLSCaseFormAppletPR.superclass.ShowUI.apply(this, arguments);
          }
        }

        HLSCaseFormAppletPR.prototype.BindEvents = function () {
          if (skipVue) {
            SiebelAppFacade.HLSCaseFormAppletPR.superclass.BindEvents.apply(this, arguments);
          }
        }

        HLSCaseFormAppletPR.prototype.BindData = function (bRefresh) {
          if (skipVue) {
            SiebelAppFacade.HLSCaseFormAppletPR.superclass.BindData.apply(this, arguments);
            return;
          }

          document.getElementById('_sweview').title = '';
          putVue(divId);
        }

        function putVue(divId) {
          var html = '\
          <div id="app">                                                                                                                                        \n\
            <v-app id="inspire">                                                                                                                                \n\
            <v-snackbar v-model="snackbar" :timeout="3000" :top="true">Record saved<v-btn color="pink" flat @click="snackbar = false">Close</v-btn></v-snackbar>\n\
            <v-container fluid>                                                                                                                                 \n\
                <v-layout row wrap>                                                                                                                             \n\
                <v-flex md12 pa-2>                                                                                                                              \n\
                  <v-alert :value="true" type="info">HLS Case Form Applet rendered by VUE.JS PR</v-alert>                                                       \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md6 pa-2>                                                                                                                               \n\
                  <v-text-field prepend-icon="play_arrow" @click:prepend="doDrillDown" :rules="controls.Name.required ? [\'Required\'] : []" v-on:input="changeValue(\'Name\')" ref="caseName" :disabled="controls.Name.readonly" :label="controls.Name.label" v-model="controls.Name.value" clearable v-on:keyup.esc="escapeOnName" v-on:click:clear="handleClear(\'Audit Employee Last Name\')" :counter="controls.Name.maxSize"></v-text-field> \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md6 pa-2>                                                                                                                               \n\
                  <v-switch v-on:change="changeValue(\'InfoChanged\')" :label="controls.InfoChanged.label" v-model="controls.InfoChanged.value" :disabled="controls.InfoChanged.readonly"></v-switch> \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md4 pa-2>                                                                                                                               \n\
                  <v-select :rules="controls.Status.required ? [\'Required\'] : []" box :items="caseStatusArr" v-on:click.native="clickStatus" v-on:change="changeValue(\'Status\')" v-model="controls.Status.value" :label="controls.Status.label" :disbaled="controls.Status.readonly"></v-select> \n\
                </v-flex>                                                                                                                                                         \n\
                <v-flex md4 pa-2>                                                                                                                                                 \n\
                  <v-select :rules="controls[\'Sub Status\'].required ? [\'Required\'] : []" box :disabled="controls[\'Sub Status\'].readonly" :items="caseSubStatusArr" v-on:click.native="clickSubStatus" v-on:change="changeValue(\'Sub Status\')" v-model="controls[\'Sub Status\'].value" :label="controls[\'Sub Status\'].label"></v-select>  \n\
                </v-flex>                                                                                                                                                         \n\
                <v-flex md4 pa-2>                                                                                                                                                 \n\
                  <v-autocomplete :rules="controls.Category.required ? [\'Required\'] : []" v-model="controls.Category.value" :disabled="controls.Category.readonly" :items="caseCategoryArr" v-on:change="changeValue(\'Category\')" :label="controls.Category.label"> \n\
                </v-flex>                                                                                                                                                         \n\
                <v-flex md4 pa-2>                                                                                                                                                 \n\
                <v-label>Threat Level: {{this.controls[\'Threat Level\'].value}}</v-label><span>                                                                                  \n\
                  <v-rating :background-color="ratingColor" :color="ratingColor" :readonly="controls[\'Threat Level\'].readonly" v-on:input="changeThreatLevel" v-model="caseThreatLevelNum" clearable length="3" label="Threat Level"></v-rating>  \n\
                </span></v-flex>                                                                                                                                \n\
                <v-flex md4 pa-2>                                                                                                                               \n\
                  <v-label>Sales Rep:</v-label>                                                                                                                 \n\
                  <v-tooltip top v-for="salesRep in caseSalesRepArr" >                                                                                          \n\
                  <v-chip slot="activator" :close="salesRep.login!=caseSalesRepPrimary" @input="clickDeleteSalesRep(salesRep)"><v-avatar :class="{teal : salesRep.login!=caseSalesRepPrimary}">   \n\
                  <v-icon v-if="salesRep.login==caseSalesRepPrimary">check_circle</v-icon>{{salesRep.login==caseSalesRepPrimary ? "" : salesRep.login[0]}}</v-avatar>{{salesRep.login}}</v-chip>  \n\
                  <span>{{salesRep.firstName + " " + salesRep.lastName}}</span></v-tooltip>                                                                     \n\
                  <v-btn flat icon v-on:click="showMvgApplet" color="indigo"><v-icon>edit</v-icon></v-btn>                                                      \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md4 pa-2>                                                                                                                               \n\
                  <v-text-field append-icon="report" @click:append="openPickApplet" :rules="controls[\'Audit Employee Last Name\'].required ? [\'Required\'] : []" v-on:input="changeValue(\'Audit Employee Last Name\')" :disabled="controls[\'Audit Employee Last Name\'].readonly" :label="controls[\'Audit Employee Last Name\'].label" v-model="controls[\'Audit Employee Last Name\'].value" clearable v-on:keyup.esc="escapeOnName" v-on:click:clear="handleClear(\'Audit Employee Last Name\')" :counter="controls[\'Audit Employee Last Name\'].maxSize"></v-text-field> \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md12 pa-2>                                                                                                                              \n\
                  <v-textarea v-on:change="changeValue(\'Description\')" rows="7" :disabled="controls.Description.readonly" :label="controls.Description.label" v-model="controls.Description.value" :counter="controls.Description.maxSize" box name="input-7-1"></v-textarea> \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md12 pa-2>                                                                                                                              \n\
                  <v-divider></v-divider>                                                                                                                       \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md1 pa-2>                                                                                                                               \n\
                  <v-btn block v-on:click="saveButtonClick" color="primary"><v-icon>save</v-icon>Save!</v-btn>                                                        \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md1 pa-2>                                                                                                                               \n\
                  <v-btn block v-on:click="deleteButtonClick" color="primary"><v-icon>delete</v-icon>Delete!</v-btn>                                                  \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md1 pa-2>                                                                                                                               \n\
                  <v-btn block v-on:click="testButtonClick" color="primary"><v-icon>pan_tool</v-icon>Pick!</v-btn>                                                    \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md1 pa-2>                                                                                                                               \n\
                  <v-btn block v-on:click="testButtonClickShuttle" color="primary"><v-icon>pan_tool</v-icon>Shuttle!</v-btn>                                                    \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md5 pa-2>                                                                                                                               \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md1 pa-2>                                                                                                                               \n\
                  <v-btn block v-on:click="gotoButtonClick" color="primary"><v-icon>language</v-icon>Goto!</v-btn>                                                    \n\
                </v-flex>                                                                                                                                       \n\
                <v-flex md1 pa-2>                                                                                                                               \n\
                  <v-tooltip top><v-btn block slot="activator" v-on:click="prevButtonClick" color="primary"><v-icon>navigate_before</v-icon></v-btn><span>Go to the previous record</span></v-tooltip>  \n\
                </v-flex>                                                                                                                                                                         \n\
                <v-flex md1 pa-2>                                                                                                                                                                 \n\
                  <v-tooltip top><v-btn block slot="activator" v-on:click="nextButtonClick" color="primary"><v-icon>navigate_next</v-icon></v-btn><span>Go to the previous record</span></v-tooltip>    \n\
                </v-flex>                                                                                     \n\
                <v-fab-transition>                                                                            \n\
                  <v-btn v-on:click="newButtonClick" v-show="true" color="pink" dark fixed bottom right fab>  \n\
                    <v-icon>add</v-icon>                                                                      \n\
                  </v-btn>                                                                                    \n\
                </v-fab-transition>                                                                           \n\
                </v-layout>                                                                                   \n\
              </v-container></v-app>                                                                          \n\
          </div>';

          $('#' + divId).append(html);

          app = new Vue({
            el: '#app',
            mounted: function () {
              this.fieldToControlsMap = n19helper.getFieldToControlsMap(this.controls);
              this.afterSelection();
              $('.application--wrap').css({ 'min-height': 'auto' });
            },
            data: {
              controls: {
                Name: {},
                Status: {},
                'Sub Status': {},
                InfoChanged: {},
                Description: {},
                Category: {},
                'Threat Level': {},
                'Sales Rep': {},
                'Audit Employee Last Name': {}
              },
              caseThreatLevelNum: 0,
              snackbar: false,
              caseStatusArr: [],
              caseSubStatusArr: [],
              caseCategoryArr: [],
              caseThreatLevelArr: ['Low', 'Medium', 'High'],
              caseSalesRepArr: [],
              caseSalesRep: '',
              caseSalesRepPrimary: ''
            },
            computed: {
              ratingColor: function () {
                return this.controls['Threat Level'].readonly ? 'grey' : 'red';
              }
            },
            methods: {
              testButtonClick() {
                var ret = n19helper.showPickApplet('Audit Employee Last Name', true, function () {
                  if (!SiebelAppFacade.N19['Pharma Employee Pick Applet']) {
                    alert('Pharma Employee Pick Applet is not found in SiebelAppFacade');
                  }
                  if (Object.keys(SiebelAppFacade.N19).length !== 3) {
                    alert('SiebelAppFacade length has not expected value - ' + Object.keys(SiebelAppFacade.N19).length);
                  }
                });
                if (!ret) {
                  alert('(testButtonClick)retured value is false')
                }
              },
              testButtonClickShuttle() {
                var ret = n19helper.showMvgApplet('Sales Rep', true, function () {
                  if (!SiebelAppFacade.N19['Contact Team Mvg Applet']) {
                    alert('Contact Team Mvg Applet is not found in SiebelAppFacade');
                  }
                  if (!SiebelAppFacade.N19['Team Member Assoc Applet']) {
                    alert('Team Member Assoc Applet is not found in SiebelAppFacade');
                  }
                  if (Object.keys(SiebelAppFacade.N19).length !== 4) {
                    alert('SiebelAppFacade length has not expected value - ' + Object.keys(SiebelAppFacade.N19).length);
                  }
                  // list all MVG shuttle, delete all team members except primary
                  var isRecord = SiebelAppFacade.N19['Contact Team Mvg Applet']._firstRecord();
                  while (isRecord) {
                    var obj = { 'SSA Primary Field': {} };
                    SiebelAppFacade.N19['Contact Team Mvg Applet'].getCurrentRecordModel(obj);
                    var value = obj['SSA Primary Field'].value;
                    if (value) { // the record is not primary
                      var isRecord = SiebelAppFacade.N19['Contact Team Mvg Applet'].nextRecord();
                    } else {
                      isRecord = SiebelAppFacade.N19['Contact Team Mvg Applet'].deleteRecords(() => {
                        console.log('DELETE RECORDS CALLBACK');
                      });
                      var isRecord = SiebelAppFacade.N19['Contact Team Mvg Applet']._firstRecord();
                    }
                  }
                });
                if (!ret) {
                  alert('(testButtonClickShuttle)retured value is false')
                }
              },
              openPickApplet() {
                if (!n19helper.showPickApplet('Audit Employee Last Name')) {
                  alert('openPickApplet(returned value is false)')
                }
              },
              showMvgApplet() {
                if (!n19helper.showMvgApplet('Sales Rep')) {
                  alert('showMvgApplet(returned value is false)')
                }
              },
              doDrillDown() {
                if (SiebelAppFacade.N19['HLS Case List Applet']) {
                  SiebelAppFacade.N19['HLS Case List Applet'].drilldown('Name');
                }
              },
              changeValue(name) {
                var isChanged = n19helper.setControlValue(name, this.controls[name].value);
                if (isChanged && this.controls[name].isPostChanges) {
                  this.afterSelection();
                };
                if (!isChanged) {
                  var currentValue = n19helper.getCurrentRecord()[name];
                  this.controls[name].value = '';
                  setTimeout(function () { //todo: use next tick
                    this.controls[name].value = currentValue;
                  }.bind(this))
                }
              },
              changeThreatLevel(val) {
                n19helper.setControlValue('Threat Level', val > 0 ? this.caseThreatLevelArr[val - 1] : '');
              },
              clickSubStatus: function () {
                var arr = n19helper.getDynamicLOV('Sub Status');
                this.caseSubStatusArr = this.controls['Sub Status'].value ? [this.controls['Sub Status'].value] : [];
                for (var i = 0; i < arr.length; i++) {
                  if ((arr[i] != '') && (arr[i] != this.controls['Sub Status'].value)) {
                    this.caseSubStatusArr.push(arr[i]);
                  }
                }
              },
              clickStatus: function () {
                var arr = n19helper.getDynamicLOV('Status');
                this.caseStatusArr = [this.controls.Status.value];
                for (var i = 0; i < arr.length; i++) {
                  if ((arr[i] != '') && (arr[i] != this.controls.Status.value)) {
                    this.caseStatusArr.push(arr[i]);
                  }
                }
              },
              escapeOnName: function () {
                this.controls.Name.value = n19helper.getCurrentRecord().Name;
                this.changeValue('Name');
              },
              handleClear: function (name) { // this is needed because clearing set the model value to null
                this.controls[name].value = '';     // maybe it is not needed if we handle it inside N19
                this.changeValue(name);
              },
              newButtonClick: function () {
                n19helper.newRecord(function () {
                  setTimeout(function () {
                    this.$refs.caseName.focus();
                  }.bind(this));
                }.bind(this));
              },
              deleteButtonClick: function () {
                n19helper.deleteRecord();
              },
              gotoButtonClick: function () {
                n19helper.gotoView('PUB GOV Case Activity Plans View', 'HLS Case Form Applet');
              },
              saveButtonClick: function () {
                n19helper.writeRecord(function () {
                  this.snackbar = true;
                  this.afterSelection();
                }.bind(this));
              },
              nextButtonClick: function () {
                if (!n19helper.canInvokeMethod("GotoNextSet")) {
                  alert('GotoNextSet is not allowed to invoke');
                } else {
                  n19helper.nextRecord();
                }
              },
              prevButtonClick: function () {
                if (!n19helper.canInvokeMethod("GotoPreviousSet")) {
                  alert('GotoPreviousSet is not allowed to invoke');
                } else {
                  n19helper.prevRecord();
                }
              },
              updateFieldData(name, value) {
                console.log('updateFieldData', arguments);
                if (typeof value === 'undefined') {
                  // do we need to do something when it is undefined?
                  value = n19helper.getCurrentRecord()[name];
                }
                var control = this.fieldToControlsMap[name];

                if (control && value) {
                  value = n19helper.getControlValue(control.uiType, value);
                  if ('Threat Level' === name) {
                    this.caseThreatLevelNum = this.caseThreatLevelArr.indexOf(value) + 1;
                  }
                  if (value == this.controls[control.name].value) {
                    return;
                  }
                  this.controls[control.name].value = value;
                  if ('Status' === name) {
                    this.caseStatusArr = [value];
                  } else if ('Sub Status' === name) {
                    this.caseSubStatusArr = [value];
                  }
                  if (control.isPostChanges) {
                    Vue.nextTick(function () {
                      this.afterSelection();
                    }.bind(this));
                  }
                }
              },
              updatePrimary() {
                console.log('<<<<<<<<< change case primary <<<', this.caseSalesRep, this.caseSalesRepArr, this.caseSalesRepPrimary);
                // todo : check if current primary is ok
                if (SiebelApp.S_App.GetActiveBusObj().GetBusCompByName('Position')) {
                  var arr = SiebelApp.S_App.GetActiveBusObj().GetBusCompByName('Position').GetRecordSet();
                  for (var i = 0; i < arr.length; i++) {
                    if (arr[i]['SSA Primary Field'] == 'Y') {
                      this.caseSalesRepPrimary = arr[i]['Active Login Name'];
                      break;
                    }
                  }
                } else {
                  this.caseSalesRepPrimary = this.caseSalesRep
                }
              },
              updateSalesRep(val) {
                console.log('<<< update sales rep', val);
                if (val != this.caseSalesRep) {
                  // todo : check if array already contains this Sales Rep
                  this.caseSalesRep = val;
                  this.getSalesRep(val);
                }
              },
              getSalesRep: function (val) {
                //todo: if we have several mvg links on the same business component, are we going to be confused?
                //it effective aslo when we are insert pending
                if (SiebelApp.S_App.GetActiveBusObj().GetBusCompByName('Position')) {
                  setTimeout(function () {
                    var arr = SiebelApp.S_App.GetActiveBusObj().GetBusCompByName('Position').GetRecordSet();
                    if (arr) {
                      this.caseSalesRepArr = [];
                      for (var i = 0; i < arr.length; i++) {
                        console.log('from definition of active bus object', arr[i]);
                        var obj = {
                          firstName: arr[i]["Active First Name"],
                          lastName: arr[i]["Active Last Name"],
                          login: arr[i]["Active Login Name"],
                          id: arr[i].Id
                        }
                        this.caseSalesRepArr.push(obj);
                        if (arr[i]['SSA Primary Field'] == 'Y') {
                          this.caseSalesRepPrimary = arr[i]["Active Login Name"];
                        }
                      }
                      this.caseSalesRepArr.sort(function (a, b) {
                        return (a.login > b.login) ? -1 : 1;
                      });
                    }
                  }.bind(this));
                  return;
                }
                //we don't have an object yet in memory, query the server
                setTimeout(function () {
                  var service = SiebelApp.S_App.GetService("N19 BS");
                  if (service) {
                    var ai = {
                      async: true,
                      selfbusy: true,
                      scope: this,
                      cb: function (method, psInput, psOutput) {
                        console.log('BS output to get the sales reps...', psOutput.childArray);
                        var resultSet = psOutput.GetChildByType("ResultSet");
                        if (resultSet) {
                          this.caseSalesRepArr = [];
                          for (var i = 0; i < resultSet.GetChildCount(); i++) {
                            var obj = {
                              firstName: resultSet.GetChild(i).GetProperty('First'),
                              lastName: resultSet.GetChild(i).GetProperty('Last'),
                              login: resultSet.GetChild(i).GetProperty('Login'),
                              id: resultSet.GetChild(i).GetProperty('Id')
                            }
                            this.caseSalesRepArr.push(obj);
                            if (resultSet.GetChild(i).GetProperty('Primary') === 'Y') {
                              this.caseSalesRepPrimary = resultSet.GetChild(i).GetProperty('Login');
                            }
                          }
                          this.caseSalesRepArr.sort(function (a, b) {
                            return (a.login > b.login) ? -1 : 1;
                          });
                        }
                      }
                    };
                    service.InvokeMethod("GetSalesRep", null, ai);
                  }
                }.bind(this));

              },
              deleteSalesRep(appletName, id) {
                var helper = SiebelAppFacade.N19[appletName];

                var isRecord = helper._firstRecord();
                while (isRecord) {
                  var obj = helper.getCurrentRecord(true);
                  // var recPrimary = obj['SSA Primary Field'];
                  var recId = obj.Id;
                  if (recId === id) {
                    // check for primary
                    helper.deleteRecords();
                    return;
                  } else {
                    isRecord = helper.nextRecord();
                  }
                }
              },
              clickDeleteSalesRep(salesRep) {
                console.log('>>> clickDeleteSalesRep input', salesRep, salesRep.login, this.caseSalesRepArr);
                var ret = n19helper.n19popup.isPopupOpen();
                var controlName = ret.controlName;
                var appletName = ret.appletName;
                if ('Sales Rep' !== controlName) {
                    var ret = n19helper.showMvgApplet('Sales Rep', true, function (appletName) {
                      alert('I am invoked');
                      this.deleteSalesRep(appletName, salesRep.id);
                    }.bind(this));
                    if (!ret) {
                      alert('(clickDeleteSalesRep)retured value is false')
                    }
                } else {
                  this.deleteSalesRep(appletName, salesRep.id);
                }
              },
              afterSelection: function () {
                console.log('>>>>>>>>>>>>>>>>>>> AFTER SELECTION STARTED....');
                n19helper.getCurrentRecordModel(this.controls);

                if (0 === this.caseCategoryArr.length) {
                  this.caseCategoryArr = n19helper.getStaticLOV('Category');
                }

                this.caseThreatLevelNum = this.caseThreatLevelArr.indexOf(this.controls['Threat Level'].value) + 1;
                this.caseStatusArr = [this.controls.Status.value];
                this.caseSubStatusArr = [this.controls['Sub Status'].value];
                this.caseSalesRep = this.controls['Sales Rep'].value;
                if (n19helper.insertPending()) {
                  console.log('skipped calling sales rep BS because insert pending');
                  // or get it from the current buscomp?
                  this.caseSalesRepArr = [{
                    firstName: '',
                    lastName: '',
                    id: '',
                    primary: true,
                    login: this.caseSalesRep
                  }];
                } else if (this.controls.isRecord) {
                  this.getSalesRep();
                }
              }
            }
          });
        }

        HLSCaseFormAppletPR.prototype.EndLife = function () {
          SiebelApp.S_App.NotifyObject.prototype.NotifyNewFieldData = SiebelAppFacade.N19notifyNewFieldData;
          SiebelApp.S_App.NotifyObject.prototype.NotifyNewPrimary = SiebelAppFacade.N19notifyNewPrimary;

          if (app) {
            app.$destroy(true);
            $('#app').remove();
            app = null;
          }
          // $("link[href*='vuetify.min.css']").remove();
          n19helper = null;
          if (SiebelAppFacade.N19 && SiebelAppFacade.N19[appletName]) {
            delete SiebelAppFacade.N19[appletName];
          }
          SiebelAppFacade.HLSCaseFormAppletPR.superclass.EndLife.apply(this, arguments);
        }

        return HLSCaseFormAppletPR;
      }()
      );
      return "SiebelAppFacade.HLSCaseFormAppletPR";
    })
}
