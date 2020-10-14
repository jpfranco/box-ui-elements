// @flow

import * as React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingIndicatorWrapper from '../../components/loading-indicator/LoadingIndicatorWrapper';
import { Link } from '../../components/link';
import Button from '../../components/button';
import { UpgradeBadge } from '../../components/badge';
import { ITEM_TYPE_WEBLINK } from '../../common/constants';
import Tooltip from '../../components/tooltip';
import { CollaboratorAvatars, CollaboratorList } from '../collaborator-avatars';

import InviteePermissionsMenu from './InviteePermissionsMenu';
import messages from './messages';
import SharedLinkSection from './SharedLinkSection';
import EmailForm from './EmailForm';
import getDefaultPermissionLevel from './utils/defaultPermissionLevel';
import mergeContacts from './utils/mergeContacts';
import { JUSTIFICATION_CHECKPOINT_EXTERNAL_COLLAB } from './constants';

import type {
    contactType as Contact,
    item as Item,
    justificationCheckpointType as JustificationCheckpoint,
    USFProps,
} from './flowTypes';
import type { SelectOptionProp } from '../../components/select-field/props';

const SHARED_LINKS_COMMUNITY_URL = 'https://community.box.com/t5/Using-Shared-Links/Creating-Shared-Links/ta-p/19523';
const INVITE_COLLABS_CONTACTS_TYPE = 'inviteCollabsContacts';
const EMAIL_SHARED_LINK_CONTACTS_TYPE = 'emailSharedLinkContacts';

type State = {
    classificationLabelId: string,
    emailSharedLinkContacts: Array<Contact>,
    inviteCollabsContacts: Array<Contact>,
    inviteePermissionLevel: string,
    isEmailLinkSectionExpanded: boolean,
    isFetchingJustificationReasons: boolean,
    isInviteSectionExpanded: boolean,
    justificationReasons: Array<SelectOptionProp>,
    showCollaboratorList: boolean,
};

class UnifiedShareForm extends React.Component<USFProps, State> {
    static defaultProps = {
        displayInModal: true,
        initiallySelectedContacts: [],
        createSharedLinkOnLoad: false,
        focusSharedLinkOnLoad: false,
        trackingProps: {
            collaboratorListTracking: {},
            inviteCollabsEmailTracking: {},
            inviteCollabTracking: {},
            modalTracking: {},
            removeLinkConfirmModalTracking: {},
            sharedLinkEmailTracking: {},
            sharedLinkTracking: {},
        },
    };

    constructor(props: USFProps) {
        super(props);

        this.state = {
            classificationLabelId: '',
            emailSharedLinkContacts: [],
            inviteCollabsContacts: props.initiallySelectedContacts,
            inviteePermissionLevel: '',
            isEmailLinkSectionExpanded: false,
            isFetchingJustificationReasons: false,
            isInviteSectionExpanded: !!props.initiallySelectedContacts.length,
            justificationReasons: [],
            showCollaboratorList: false,
        };
    }

    async componentDidUpdate(prevProps: USFProps) {
        const { areJustificationsAllowed, isExternalCollabRestrictedByAccessPolicy, item } = this.props;
        const {
            areJustificationsAllowed: prevAreJustificationsAllowed,
            isExternalCollabRestrictedByAccessPolicy: prevIsExternalCollabRestrictedByAccessPolicy,
        } = prevProps;

        const didExternalCollabRestrictionsChange =
            areJustificationsAllowed !== prevAreJustificationsAllowed ||
            isExternalCollabRestrictedByAccessPolicy !== prevIsExternalCollabRestrictedByAccessPolicy;

        if (didExternalCollabRestrictionsChange && this.isJustificationRequiredForExternalCollabs()) {
            this.fetchJustificationReasons(item, JUSTIFICATION_CHECKPOINT_EXTERNAL_COLLAB);
        }
    }

    fetchJustificationReasons = async (item: Item, checkpoint: JustificationCheckpoint) => {
        const { getJustificationReasons } = this.props;

        if (!getJustificationReasons) {
            return;
        }
        this.setState({ isFetchingJustificationReasons: true });

        try {
            const { classificationLabelId, options } = await getJustificationReasons(item, checkpoint);

            this.setState({
                classificationLabelId,
                justificationReasons: options.map(({ id, title }) => ({
                    displayText: title,
                    value: id,
                })),
            });
        } finally {
            this.setState({ isFetchingJustificationReasons: false });
        }
    };

    isJustificationRequiredForExternalCollabs = () => {
        const { areJustificationsAllowed, isExternalCollabRestrictedByAccessPolicy } = this.props;
        const isJustificationRequiredForExternalCollabs =
            isExternalCollabRestrictedByAccessPolicy && areJustificationsAllowed;

        return isJustificationRequiredForExternalCollabs;
    };

    handleInviteCollabPillCreate = (pills: Array<SelectOptionProp | Contact>) => {
        return this.onPillCreate(INVITE_COLLABS_CONTACTS_TYPE, pills);
    };

    handleEmailSharedLinkPillCreate = (pills: Array<SelectOptionProp | Contact>) => {
        return this.onPillCreate(EMAIL_SHARED_LINK_CONTACTS_TYPE, pills);
    };

    onToggleSharedLink = (event: SyntheticInputEvent<HTMLInputElement>) => {
        const { target } = event;
        const {
            handleFtuxCloseClick,
            onAddLink,
            openConfirmModal,
            shouldRenderFTUXTooltip,
            trackingProps,
        } = this.props;
        const { sharedLinkTracking } = trackingProps;
        const { onToggleLink } = sharedLinkTracking;

        if (shouldRenderFTUXTooltip) {
            handleFtuxCloseClick();
        }

        if (target.type === 'checkbox') {
            if (target.checked === false) {
                openConfirmModal();
            } else {
                onAddLink();
            }

            if (onToggleLink) {
                onToggleLink(target.checked);
            }
        }
    };

    showCollaboratorList = () => {
        this.setState({ showCollaboratorList: true });
    };

    closeCollaboratorList = () => {
        this.setState({ showCollaboratorList: false });
    };

    handleSendInvites = async (data: Object) => {
        const { inviteePermissions, sendInvites, submitJustificationReason, trackingProps } = this.props;
        const { inviteCollabsEmailTracking } = trackingProps;
        const { onSendClick } = inviteCollabsEmailTracking;
        const { classificationLabelId, inviteePermissionLevel } = this.state;
        const defaultPermissionLevel = getDefaultPermissionLevel(inviteePermissions);
        const selectedPermissionLevel = inviteePermissionLevel || defaultPermissionLevel;
        const { emails, externalEmails, groupIDs, justificationReason, message } = data;
        const hasExternalInvitees = !!externalEmails && !!externalEmails.length;

        const params = {
            emails: emails.join(','),
            groupIDs: groupIDs.join(','),
            emailMessage: message,
            permission: selectedPermissionLevel,
            numsOfInvitees: emails.length,
            numOfInviteeGroups: groupIDs.length,
        };

        if (this.isJustificationRequiredForExternalCollabs() && hasExternalInvitees) {
            await submitJustificationReason({
                checkpoint: JUSTIFICATION_CHECKPOINT_EXTERNAL_COLLAB,
                classificationLabelId,
                emails: externalEmails,
                justificationReason: {
                    id: justificationReason.value,
                    title: justificationReason.displayText,
                },
            });
        }

        if (onSendClick) {
            onSendClick(params);
        }

        return sendInvites(params);
    };

    handleSendSharedLink = (data: Object) => {
        const { sendSharedLink, trackingProps } = this.props;
        const { sharedLinkEmailTracking } = trackingProps;
        const { onSendClick } = sharedLinkEmailTracking;

        const { emails, groupIDs } = data;

        if (onSendClick) {
            const params = {
                ...data,
                numsOfRecipients: emails.length,
                numOfRecipientGroups: groupIDs.length,
            };
            onSendClick(params);
        }

        return sendSharedLink(data);
    };

    // TODO-AH: Change permission level to use the appropriate flow type
    handleInviteePermissionChange = (permissionLevel: string) => {
        const { trackingProps } = this.props;
        const { inviteCollabTracking } = trackingProps;
        const { onInviteePermissionChange } = inviteCollabTracking;

        this.setState({ inviteePermissionLevel: permissionLevel });

        if (onInviteePermissionChange) {
            onInviteePermissionChange(permissionLevel);
        }
    };

    handleRemoveExternalInviteCollabsContacts = () => {
        const { inviteCollabsContacts } = this.state;
        const filteredInviteCollabsContacts = inviteCollabsContacts.filter(({ isExternalUser }) => !isExternalUser);

        this.setState({
            inviteCollabsContacts: filteredInviteCollabsContacts,
        });
    };

    onPillCreate = (type: string, pills: Array<SelectOptionProp | Contact>) => {
        // If this is a dropdown select event, we ignore it
        // $FlowFixMe
        const selectOptionPills = pills.filter(pill => !pill.id);
        if (selectOptionPills.length === 0) {
            return;
        }

        const { getContactsByEmail } = this.props;

        if (getContactsByEmail) {
            const emails = pills.map(pill => pill.value);
            // $FlowFixMe
            getContactsByEmail({ emails }).then((contacts: Object) => {
                if (type === INVITE_COLLABS_CONTACTS_TYPE) {
                    this.setState(prevState => ({
                        inviteCollabsContacts: mergeContacts(prevState.inviteCollabsContacts, contacts),
                    }));
                } else if (type === EMAIL_SHARED_LINK_CONTACTS_TYPE) {
                    this.setState(prevState => ({
                        emailSharedLinkContacts: mergeContacts(prevState.emailSharedLinkContacts, contacts),
                    }));
                }
            });
        }
    };

    openInviteCollaborators = (value: string) => {
        const { handleFtuxCloseClick } = this.props;
        if (this.state.isInviteSectionExpanded) {
            return;
        }

        // checking the value because IE seems to trigger onInput immediately
        // on focus of the contacts field
        if (value !== '') {
            handleFtuxCloseClick();
            this.setState(
                {
                    isInviteSectionExpanded: true,
                },
                () => {
                    const {
                        trackingProps: {
                            inviteCollabTracking: { onEnterInviteCollabs },
                        },
                    } = this.props;

                    if (onEnterInviteCollabs) {
                        onEnterInviteCollabs();
                    }
                },
            );
        }
    };

    openInviteCollaboratorsSection = () => {
        this.setState({
            isInviteSectionExpanded: true,
        });
    };

    closeInviteCollaborators = () => {
        this.setState({
            isInviteSectionExpanded: false,
        });
    };

    openEmailSharedLinkForm = () => {
        const { handleFtuxCloseClick } = this.props;
        handleFtuxCloseClick();
        this.setState({
            isEmailLinkSectionExpanded: true,
        });
    };

    closeEmailSharedLinkForm = () => {
        this.setState({ isEmailLinkSectionExpanded: false });
    };

    hasExternalContact = (type: string): boolean => {
        const { inviteCollabsContacts, emailSharedLinkContacts } = this.state;
        if (type === INVITE_COLLABS_CONTACTS_TYPE) {
            return inviteCollabsContacts.some(contact => contact.isExternalUser);
        }
        if (type === EMAIL_SHARED_LINK_CONTACTS_TYPE) {
            return emailSharedLinkContacts.some(contact => contact.isExternalUser);
        }
        return false;
    };

    updateInviteCollabsContacts = (inviteCollabsContacts: Array<Contact>) => {
        const { setUpdatedContacts } = this.props;
        this.setState({
            inviteCollabsContacts,
        });
        if (setUpdatedContacts) {
            setUpdatedContacts(inviteCollabsContacts);
        }
    };

    updateEmailSharedLinkContacts = (emailSharedLinkContacts: Array<Contact>) => {
        this.setState({
            emailSharedLinkContacts,
        });
    };

    shouldAutoFocusSharedLink = () => {
        const { focusSharedLinkOnLoad, sharedLink, sharedLinkLoaded } = this.props;
        // if not forcing focus or not a newly added shared link, return false
        if (!(focusSharedLinkOnLoad || sharedLink.isNewSharedLink)) {
            return false;
        }
        // otherwise wait until the link data is loaded before focusing
        if (!sharedLinkLoaded) {
            return false;
        }
        return true;
    };

    renderInviteSection() {
        const {
            canInvite,
            collaborationRestrictionWarning,
            contactLimit,
            getCollaboratorContacts,
            getContactAvatarUrl,
            handleFtuxCloseClick,
            isExternalCollabRestrictedByAccessPolicy,
            item,
            recommendedSharingTooltipCalloutName = null,
            sendInvitesError,
            shouldRenderFTUXTooltip,
            showEnterEmailsCallout = false,
            showCalloutForUser = false,
            showUpgradeOptions,
            submitting,
            suggestedCollaborators,
            trackingProps,
        } = this.props;
        const { type } = item;
        const { isFetchingJustificationReasons, isInviteSectionExpanded, justificationReasons } = this.state;
        const { inviteCollabsEmailTracking, modalTracking } = trackingProps;
        const contactsFieldDisabledTooltip =
            type === ITEM_TYPE_WEBLINK ? (
                <FormattedMessage {...messages.inviteDisabledWeblinkTooltip} />
            ) : (
                <FormattedMessage {...messages.inviteDisabledTooltip} />
            );
        const inlineNotice = sendInvitesError
            ? {
                  type: 'error',
                  content: sendInvitesError,
              }
            : {
                  type: 'warning',
                  content: collaborationRestrictionWarning,
              };
        const avatars = this.renderCollaboratorAvatars();
        const { ftuxConfirmButtonProps } = modalTracking;
        const ftuxTooltipText = (
            <div>
                <h4 className="ftux-tooltip-title">
                    <FormattedMessage {...messages.ftuxNewUSMUserTitle} />
                </h4>
                <p className="ftux-tooltip-body">
                    <FormattedMessage {...messages.ftuxNewUSMUserBody} />{' '}
                    <Link className="ftux-tooltip-link" href={SHARED_LINKS_COMMUNITY_URL} target="_blank">
                        <FormattedMessage {...messages.ftuxLinkText} />
                    </Link>
                </p>
                <div className="ftux-tooltip-controls">
                    <Button className="ftux-tooltip-button" onClick={handleFtuxCloseClick} {...ftuxConfirmButtonProps}>
                        <FormattedMessage {...messages.ftuxConfirmLabel} />
                    </Button>
                </div>
            </div>
        );
        const ftuxTooltipProps = {
            className: 'usm-ftux-tooltip',
            // don't want ftux tooltip to show if the recommended sharing tooltip callout is showing
            isShown: !recommendedSharingTooltipCalloutName && shouldRenderFTUXTooltip && showCalloutForUser,
            position: 'middle-left',
            showCloseButton: true,
            text: ftuxTooltipText,
            theme: 'callout',
        };

        return (
            <>
                <Tooltip {...ftuxTooltipProps}>
                    <div className="invite-collaborator-container">
                        <EmailForm
                            contactLimit={contactLimit}
                            contactsFieldAvatars={avatars}
                            contactsFieldDisabledTooltip={contactsFieldDisabledTooltip}
                            contactsFieldLabel={<FormattedMessage {...messages.inviteFieldLabel} />}
                            getContacts={getCollaboratorContacts}
                            getContactAvatarUrl={getContactAvatarUrl}
                            inlineNotice={inlineNotice}
                            isContactsFieldEnabled={canInvite}
                            isExpanded={isInviteSectionExpanded}
                            isFetchingJustificationReasons={isFetchingJustificationReasons}
                            isExternalUserSelected={this.hasExternalContact(INVITE_COLLABS_CONTACTS_TYPE)}
                            isJustificationRequiredForExternalUsers={this.isJustificationRequiredForExternalCollabs()}
                            justificationReasons={justificationReasons}
                            onContactInput={this.openInviteCollaborators}
                            onPillCreate={this.handleInviteCollabPillCreate}
                            onRequestClose={this.closeInviteCollaborators}
                            onRemoveExternalContacts={this.handleRemoveExternalInviteCollabsContacts}
                            onSubmit={this.handleSendInvites}
                            openInviteCollaboratorsSection={this.openInviteCollaboratorsSection}
                            recommendedSharingTooltipCalloutName={recommendedSharingTooltipCalloutName}
                            showEnterEmailsCallout={showEnterEmailsCallout}
                            submitting={submitting}
                            selectedContacts={this.state.inviteCollabsContacts}
                            shouldInvalidateExternalCollabs={isExternalCollabRestrictedByAccessPolicy}
                            suggestedCollaborators={suggestedCollaborators}
                            updateSelectedContacts={this.updateInviteCollabsContacts}
                            {...inviteCollabsEmailTracking}
                        >
                            {this.renderInviteePermissionsDropdown()}
                            {isInviteSectionExpanded && showUpgradeOptions && this.renderUpgradeLinkDescription()}
                        </EmailForm>
                    </div>
                </Tooltip>
            </>
        );
    }

    renderCollaboratorAvatars() {
        const { collaboratorsList, canInvite, currentUserID, item, trackingProps } = this.props;
        const { modalTracking } = trackingProps;
        let avatarsContent = null;

        if (collaboratorsList) {
            const { collaborators } = collaboratorsList;
            const { hideCollaborators = true } = item;
            const canShowCollaboratorAvatars = hideCollaborators ? canInvite : true;

            // filter out the current user by comparing to the ItemCollabRecord ID field
            avatarsContent = canShowCollaboratorAvatars && (
                <CollaboratorAvatars
                    collaborators={collaborators.filter(collaborator => String(collaborator.userID) !== currentUserID)}
                    onClick={this.showCollaboratorList}
                    containerAttributes={modalTracking.collaboratorAvatarsProps}
                />
            );
        }

        return avatarsContent;
    }

    renderUpgradeLinkDescription() {
        const { trackingProps = {} } = this.props;
        const { inviteCollabsEmailTracking = {} } = trackingProps;
        const { upgradeLinkProps = {} } = inviteCollabsEmailTracking;

        return (
            <div className="upgrade-description">
                <UpgradeBadge type="warning" />
                <FormattedMessage
                    values={{
                        upgradeGetMoreAccessControlsLink: (
                            <Link className="upgrade-link" href="/upgrade" {...upgradeLinkProps}>
                                <FormattedMessage {...messages.upgradeGetMoreAccessControlsLink} />
                            </Link>
                        ),
                    }}
                    {...messages.upgradeGetMoreAccessControlsDescription}
                />
            </div>
        );
    }

    renderInviteePermissionsDropdown() {
        const { inviteePermissions, item, submitting, canInvite, trackingProps } = this.props;
        const { type } = item;
        const { inviteCollabTracking } = trackingProps;

        return (
            inviteePermissions && (
                <InviteePermissionsMenu
                    disabled={!canInvite || submitting}
                    inviteePermissionsButtonProps={inviteCollabTracking.inviteePermissionsButtonProps}
                    inviteePermissionLevel={this.state.inviteePermissionLevel}
                    inviteePermissions={inviteePermissions}
                    changeInviteePermissionLevel={this.handleInviteePermissionChange}
                    itemType={type}
                />
            )
        );
    }

    renderCollaboratorList() {
        const { item, collaboratorsList, trackingProps } = this.props;
        const { name, type } = item;
        const { collaboratorListTracking } = trackingProps;
        let listContent = null;

        if (collaboratorsList) {
            const { collaborators } = collaboratorsList;

            listContent = (
                <CollaboratorList
                    itemName={name}
                    itemType={type}
                    onDoneClick={this.closeCollaboratorList}
                    item={item}
                    collaborators={collaborators}
                    trackingProps={collaboratorListTracking}
                />
            );
        }

        return listContent;
    }

    render() {
        // Shared link section props
        const {
            allShareRestrictionWarning,
            changeSharedLinkAccessLevel,
            createSharedLinkOnLoad,
            changeSharedLinkPermissionLevel,
            config,
            displayInModal,
            focusSharedLinkOnLoad,
            getSharedLinkContacts,
            getContactAvatarUrl,
            intl,
            isFetching,
            item,
            onAddLink,
            onCopyError,
            onCopyInit,
            onCopySuccess,
            onDismissTooltip = () => {},
            onSettingsClick,
            sendSharedLinkError,
            sharedLink,
            showEnterEmailsCallout = false,
            showSharedLinkSettingsCallout = false,
            submitting,
            tooltips = {},
            trackingProps,
        } = this.props;
        const { sharedLinkTracking, sharedLinkEmailTracking } = trackingProps;
        const { isEmailLinkSectionExpanded, isInviteSectionExpanded, showCollaboratorList } = this.state;

        // Only show the restriction warning on the main page of the USM where the email and share link option is available
        const showShareRestrictionWarning =
            !isEmailLinkSectionExpanded &&
            !isInviteSectionExpanded &&
            !showCollaboratorList &&
            allShareRestrictionWarning;

        return (
            <div className={displayInModal ? '' : 'be bdl-UnifiedShareForm'}>
                <LoadingIndicatorWrapper isLoading={isFetching} hideContent>
                    {showShareRestrictionWarning && allShareRestrictionWarning}

                    {!isEmailLinkSectionExpanded && !showCollaboratorList && this.renderInviteSection()}

                    {!isEmailLinkSectionExpanded && !isInviteSectionExpanded && !showCollaboratorList && (
                        <SharedLinkSection
                            addSharedLink={onAddLink}
                            autofocusSharedLink={this.shouldAutoFocusSharedLink()}
                            autoCreateSharedLink={createSharedLinkOnLoad}
                            config={config}
                            triggerCopyOnLoad={createSharedLinkOnLoad && focusSharedLinkOnLoad}
                            changeSharedLinkAccessLevel={changeSharedLinkAccessLevel}
                            changeSharedLinkPermissionLevel={changeSharedLinkPermissionLevel}
                            intl={intl}
                            item={item}
                            itemType={item.type}
                            onDismissTooltip={onDismissTooltip}
                            onEmailSharedLinkClick={this.openEmailSharedLinkForm}
                            onSettingsClick={onSettingsClick}
                            onToggleSharedLink={this.onToggleSharedLink}
                            onCopyInit={onCopyInit}
                            onCopySuccess={onCopySuccess}
                            onCopyError={onCopyError}
                            sharedLink={sharedLink}
                            showSharedLinkSettingsCallout={showSharedLinkSettingsCallout}
                            submitting={submitting || isFetching}
                            trackingProps={sharedLinkTracking}
                            tooltips={tooltips}
                        />
                    )}

                    {isEmailLinkSectionExpanded && !showCollaboratorList && (
                        <EmailForm
                            contactsFieldLabel={<FormattedMessage {...messages.sendSharedLinkFieldLabel} />}
                            getContactAvatarUrl={getContactAvatarUrl}
                            getContacts={getSharedLinkContacts}
                            inlineNotice={{
                                type: 'error',
                                content: sendSharedLinkError,
                            }}
                            isContactsFieldEnabled
                            isExpanded
                            isExternalUserSelected={this.hasExternalContact(EMAIL_SHARED_LINK_CONTACTS_TYPE)}
                            onPillCreate={this.handleEmailSharedLinkPillCreate}
                            onRequestClose={this.closeEmailSharedLinkForm}
                            onSubmit={this.handleSendSharedLink}
                            showEnterEmailsCallout={showEnterEmailsCallout}
                            submitting={submitting}
                            selectedContacts={this.state.emailSharedLinkContacts}
                            updateSelectedContacts={this.updateEmailSharedLinkContacts}
                            {...sharedLinkEmailTracking}
                        />
                    )}
                    {showCollaboratorList && this.renderCollaboratorList()}
                </LoadingIndicatorWrapper>
            </div>
        );
    }
}

export { UnifiedShareForm as UnifiedShareFormBase };
export default injectIntl(UnifiedShareForm);
