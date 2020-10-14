// @flow

import * as React from 'react';
import noop from 'lodash/noop';
import getProp from 'lodash/get';
import { FormattedMessage, injectIntl } from 'react-intl';
import type { InjectIntlProvidedProps } from 'react-intl';

import FormattedCompMessage from '../../components/i18n/FormattedCompMessage';
import Param from '../../components/i18n/Param';
import Label from '../../components/label';
import PlainButton from '../../components/plain-button';
import InlineNotice from '../../components/inline-notice';
import LoadingIndicator from '../../components/loading-indicator/LoadingIndicator';
import SingleSelectField from '../../components/select-field/SingleSelectField';

import ContactsEmailsTooltip from './ContactsEmailsTooltip';
import messages from './messages';

import type { SelectOptionProp } from '../../components/select-field/props';
import type { contactType as Contact } from './flowTypes';

import './CollabRestrictionNotice.scss';

type Props = {
    error?: React.Node,
    isLoading?: boolean,
    justificationReasons: Array<SelectOptionProp>,
    onRemoveExternalContacts: () => void,
    onSelectJustificationReason: (justificationReasonOption: SelectOptionProp) => void,
    selectedContacts: Array<Contact>,
    selectedJustificationReason: ?SelectOptionProp,
} & InjectIntlProvidedProps;

const CollabRestrictionNotice = ({
    error,
    intl,
    isLoading,
    justificationReasons,
    onRemoveExternalContacts,
    onSelectJustificationReason,
    selectedContacts,
    selectedJustificationReason,
}: Props) => {
    const externalContacts = selectedContacts.filter(({ isExternalUser }) => isExternalUser);
    const externalContactCount = externalContacts.length;

    const RemoveButton = ({ children }: { children: React.Node }) => (
        <PlainButton
            className="bdl-CollabRestrictionNotice-removeBtn"
            data-resin-target="removeBtn"
            onClick={onRemoveExternalContacts}
        >
            {children}
        </PlainButton>
    );

    // TODO:
    // Switch to react-intl v3+ api once migration is complete. FormattedCompMessage is now
    // deprecated and has some issues with components nested within <Plural/>, hence why we
    // use two messages as a workaround.

    const noticeDescriptionSingular = (
        <FormattedCompMessage
            description="Notice to display when sharing a file with external collaborators requires a business justification to be provided."
            id="boxui.unifiedShare.businessJustificationRequiredSingular"
        >
            This classified content requires business justification to collaborate with{' '}
            <ContactsEmailsTooltip contacts={externalContacts}>1 person</ContactsEmailsTooltip>. Select a business
            justification below or <RemoveButton>remove them</RemoveButton> to continue.
        </FormattedCompMessage>
    );

    const noticeDescriptionPlural = (
        <FormattedCompMessage
            key={externalContactCount}
            description="Notice to display when sharing a file with external collaborators requires a business justification to be provided."
            id="boxui.unifiedShare.businessJustificationRequiredPlural"
        >
            This classified content requires business justification to collaborate with{' '}
            <ContactsEmailsTooltip contacts={externalContacts}>
                <Param value={externalContactCount} description="Number of external collborators currently selected" />{' '}
                people
            </ContactsEmailsTooltip>
            . Select a business justification below or <RemoveButton>remove them</RemoveButton> to continue.
        </FormattedCompMessage>
    );

    const noticeDescription = externalContactCount === 1 ? noticeDescriptionSingular : noticeDescriptionPlural;
    const selectedValue = getProp(selectedJustificationReason, 'value', null);

    return (
        <InlineNotice
            className="bdl-CollabRestrictionNotice"
            data-resin-component="collabRestrictionNotice"
            type="error"
        >
            <p className="bdl-CollabRestrictionNotice-description">{noticeDescription}</p>
            <Label text={<FormattedMessage {...messages.justificationSelectLabel} />}>
                {isLoading ? (
                    <LoadingIndicator className="bdl-CollabRestrictionNotice-loadingIndicator" />
                ) : (
                    <SingleSelectField
                        error={error}
                        options={justificationReasons}
                        onChange={onSelectJustificationReason}
                        placeholder={intl.formatMessage(messages.justificationSelectPlaceholder)}
                        selectedValue={selectedValue}
                    />
                )}
            </Label>
        </InlineNotice>
    );
};

CollabRestrictionNotice.displayName = 'CollabRestrictionNotice';

CollabRestrictionNotice.defaultProps = {
    justificationReasons: [],
    onRemoveExternalContacts: noop,
    onSelectJustificationReason: noop,
};

export default injectIntl(CollabRestrictionNotice);
