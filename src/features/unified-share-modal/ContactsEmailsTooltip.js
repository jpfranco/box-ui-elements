// @flow

import * as React from 'react';

import Tooltip from '../../components/tooltip';

import type { contactType as Contact } from './flowTypes';

import './ContactsEmailsTooltip.scss';

type Props = {
    children: React.Node,
    contacts: Array<Contact>,
};

const ContactsEmailsTooltip = ({ children, contacts }: Props) => {
    const emailAddresses = contacts.map(({ email }) => email).join(', ');

    return (
        <Tooltip className="bdl-ContactsEmailsTooltip" text={emailAddresses}>
            <span className="bdl-ContactsEmailsTooltip-target">{children}</span>
        </Tooltip>
    );
};

export default ContactsEmailsTooltip;
