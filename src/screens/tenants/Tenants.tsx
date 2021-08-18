import { StackActions } from '@react-navigation/native';
import I18n from 'i18n-js';
import { Icon, Text, View } from 'native-base';
import React from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TenantConnection } from '../../types/Tenant';

import HeaderComponent from '../../components/header/HeaderComponent';
import BaseProps from '../../types/BaseProps';
import Message from '../../utils/Message';
import SecuredStorage from '../../utils/SecuredStorage';
import Utils from '../../utils/Utils';
import BaseScreen from '../base-screen/BaseScreen';
import AddTenantManuallyDialog from '../../components/modal/tenants/AddTenantManuallyDialog';
import CreateTenantQrCode from './TenantQrCode';
import computeTenantStyleSheet from './TenantsStyle';
import DialogModal from '../../components/modal/DialogModal';

export interface Props extends BaseProps {}

interface State {
  tenants?: TenantConnection[];
  showAddTenantManuallyDialog?: boolean;
  showAddTenantWithQRCode?: boolean;
  showAddTenantDialog?: boolean;
  showNewTenantAddedDialog?: boolean;
  newTenant?: TenantConnection;
}

export default class Tenants extends BaseScreen<Props, State> {
  public state: State;
  public props: Props;

  public constructor(props: Props) {
    super(props);
    this.state = {
      showAddTenantWithQRCode: false,
      showAddTenantManuallyDialog: false,
      showAddTenantDialog: false,
      showNewTenantAddedDialog: false,
      newTenant: null
    };
  }

  public async componentDidMount() {
    await super.componentDidMount();
    const tenants = await this.centralServerProvider.getTenants();
    const showAddTenantWithQRCode = Utils.getParamFromNavigation(this.props.route, 'openQRCode', this.state.showAddTenantWithQRCode);
    this.setState({
      tenants,
      showAddTenantWithQRCode
    });
  }

  public setState = (
    state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>,
    callback?: () => void
  ) => {
    super.setState(state, callback);
  };

  public render() {
    const navigation = this.props.navigation;
    const { tenants, showAddTenantManuallyDialog, showAddTenantWithQRCode, showAddTenantDialog, showNewTenantAddedDialog, newTenant } =
      this.state;
    const style = computeTenantStyleSheet();
    return (
      <View style={{ flex: 1 }}>
        {showAddTenantDialog && this.renderAddTenantDialog(style)}
        {showNewTenantAddedDialog && this.renderNewTenantAddedDialog(style)}
        {showAddTenantWithQRCode ? (
          <CreateTenantQrCode
            tenants={Utils.cloneObject(this.state.tenants)}
            navigation={navigation}
            close={(tenant: TenantConnection) => {
              this.tenantCreated(tenant);
              return true;
            }}
          />
        ) : (
          <View style={style.container}>
            <HeaderComponent
              navigation={this.props.navigation}
              title={I18n.t('general.tenants')}
              rightActionIcon={null}
              hideHomeAction
              leftActionIcon="navigate-before"
              leftActionIconType="MaterialIcons"
              leftAction={() => {
                this.props.navigation.goBack();
                return true;
              }}
            />
            <View>
              <View style={style.toolBar}>
                <TouchableOpacity style={style.createTenantButton} onPress={() => this.setState({ showAddTenantDialog: true })}>
                  <Icon style={style.icon} type={'MaterialIcons'} name="add" />
                </TouchableOpacity>
                {showAddTenantManuallyDialog && (
                  <AddTenantManuallyDialog
                    navigation={navigation}
                    tenants={Utils.cloneObject(this.state.tenants)}
                    back={() => this.setState({ showAddTenantManuallyDialog: false, showAddTenantDialog: true })}
                    close={(newTenantCreated: TenantConnection) => {
                      this.tenantCreated(newTenantCreated);
                    }}
                  />
                )}
              </View>
              <FlatList
                data={tenants}
                keyExtractor={(item) => item.subdomain}
                renderItem={({ item, index }) => (
                  <Swipeable
                    overshootRight={false}
                    overshootLeft={false}
                    containerStyle={style.tenantContainer}
                    childrenContainerStyle={style.tenantNameContainer}
                    renderRightActions={() => (
                      <TouchableOpacity
                        style={style.trashIconButton}
                        onPress={() => {
                          this.deleteTenant(index, item.subdomain);
                        }}>
                        <Icon style={style.trashIcon} name="trash" />
                      </TouchableOpacity>
                    )}>
                    <TouchableOpacity
                      onPress={() => {
                        this.props.navigation.dispatch(
                          StackActions.replace('AuthNavigator', {
                            name: 'Login',
                            params: {
                              tenantSubDomain: item.subdomain
                            },
                            key: `${Utils.randomNumber()}`
                          })
                        );
                      }}>
                      <Text style={style.tenantNameText}>{item.name}</Text>
                    </TouchableOpacity>
                  </Swipeable>
                )}
              />
            </View>
          </View>
        )}
      </View>
    );
  }

  private renderAddTenantDialog(style: any) {
    return (
      <DialogModal
        animationIn={'fadeInLeft'}
        title={I18n.t('authentication.addTenantTitle')}
        renderIcon={(iconStyle) => <Icon style={iconStyle} type={'MaterialIcons'} name={'add-business'} />}
        description={I18n.t('authentication.addTenantText')}
        close={() => this.setState({ showAddTenantDialog: false })}
        withCancel={true}
        withCloseButton={true}
        buttons={[
          {
            text: I18n.t('qrCode.qrCode'),
            action: () => this.setState({ showAddTenantWithQRCode: true, showAddTenantDialog: false }),
            buttonTextStyle: style.modalPrimaryButton,
            buttonStyle: style.modalPrimaryButton
          },
          {
            text: I18n.t('general.manually'),
            action: () => this.setState({ showAddTenantManuallyDialog: true, showAddTenantDialog: false }),
            buttonTextStyle: style.modalPrimaryButton,
            buttonStyle: style.modalPrimaryButton
          }
        ]}
      />
    );
  }

  private renderNewTenantAddedDialog(style: any) {
    const { newTenant } = this.state;
    const { navigation } = this.props;
    return (
      <DialogModal
        title={I18n.t('general.newTenantAddedDialogTitle', { organizationName: newTenant?.name })}
        description={I18n.t('general.newTenantAddedDialogDescription', { tenantName: newTenant?.name })}
        withCloseButton={true}
        withCancel={true}
        cancelButtonText={I18n.t('general.close')}
        close={() => this.setState({ showNewTenantAddedDialog: false })}
        buttons={[
          {
            text: I18n.t('authentication.signUp'),
            buttonTextStyle: style.modalPrimaryButton,
            buttonStyle: style.modalPrimaryButton,
            action: () =>
              this.setState({ showNewTenantAddedDialog: false }, () =>
                navigation.navigate('SignUp', { tenantSubDomain: newTenant?.subdomain })
              )
          },
          {
            text: I18n.t('authentication.signIn'),
            buttonTextStyle: style.modalPrimaryButton,
            buttonStyle: style.modalPrimaryButton,
            action: () =>
              this.setState({ showNewTenantAddedDialog: false }, () =>
                navigation.navigate('Login', { tenantSubDomain: newTenant?.subdomain })
              )
          }
        ]}
      />
    );
  }

  private tenantCreated = async (newTenant: TenantConnection) => {
    // Always close pop-up
    this.setState({
      showAddTenantWithQRCode: false,
      showAddTenantManuallyDialog: false
    });
    if (newTenant) {
      const foundTenant = this.state.tenants.find((tenant: TenantConnection) => tenant.subdomain === newTenant.subdomain);
      if (foundTenant) {
        // Tenant already exists
        Message.showInfo(I18n.t('general.tenantExists', { tenantName: foundTenant.name }));
      } else {
        // Refresh
        const tenants = await this.centralServerProvider.getTenants();
        this.setState({
          tenants,
          newTenant,
          showNewTenantAddedDialog: true
        });
        Message.showSuccess(I18n.t('general.createTenantSuccess', { tenantName: newTenant.name }));
      }
    }
  };

  private deleteTenant = async (index: number, subdomain: string) => {
    const tenants = this.state.tenants;
    // Remove
    const tenant = tenants.splice(index, 1)[0];
    // Save
    await SecuredStorage.saveTenants(tenants);
    // Remove cache
    await SecuredStorage.deleteUserCredentials(subdomain);
    this.setState({ tenants });
    Message.showSuccess(I18n.t('general.deleteTenantSuccess', { tenantName: tenant.name }));
  };
}
