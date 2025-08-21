import React from 'react';
import { AnswerContent, CitationType, References } from '@box/box-ai-content-answers';
import { Card, Text } from '@box/blueprint-web';
import BoxAIIconColor from '@box/blueprint-web-assets/icons/Logo/BoxAiLogo';
import { Size4 } from '@box/blueprint-web-assets/tokens/tokens';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { isValidDate } from '../../../utils/datetime';
import messages from './messages';

import './AppliedByAiClassificationReason.scss';

export interface AppliedByAiClassificationReasonProps {
    answer: string;
    modifiedAt?: string;
    citations?: CitationType[];
}

const AppliedByAiClassificationReason = ({ answer, modifiedAt, citations }: AppliedByAiClassificationReasonProps) => {
    const modifiedDate = new Date(modifiedAt);
    const isModifiedDateAvailable = Boolean(modifiedAt) && isValidDate(modifiedDate);

    const formattedModifiedAt = isModifiedDateAvailable && (
        <FormattedDate value={modifiedDate} month="long" year="numeric" day="numeric" />
    );

    return (
        <Card className="AppliedByAiClassificationReason">
            <h3 className="AppliedByAiClassificationReason-header">
                <BoxAIIconColor height={Size4} width={Size4} />
                <Text
                    className="AppliedByAiClassificationReason-headerText"
                    as="span"
                    color="textOnLightSecondary"
                    variant="bodyDefaultSemibold"
                >
                    {isModifiedDateAvailable ? (
                        <FormattedMessage
                            {...messages.appliedByBoxAiOnDate}
                            values={{ modifiedAt: formattedModifiedAt }}
                        />
                    ) : (
                        <FormattedMessage {...messages.appliedByBoxAi} />
                    )}
                </Text>
            </h3>
            <AnswerContent className="AppliedByAiClassificationReason-answer" answer={answer} />
            <div className="AppliedByAiClassificationReason-references">
                <References citations={citations} />
            </div>
        </Card>
    );
};

export default AppliedByAiClassificationReason;
