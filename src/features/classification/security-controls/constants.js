// @flow
const MAX_APP_COUNT = 3;

const SECURITY_CONTROLS_FORMAT = {
    FULL: 'full',
    SHORT: 'short',
    SHORT_WITH_TOOLTIP: 'shortWithTooltip',
};

const ACCESS_POLICY_RESTRICTION = {
    SHARED_LINK: 'sharedLink',
    DOWNLOAD: 'download',
    EXTERNAL_COLLAB: 'externalCollab',
    APP: 'app',
    FTP: 'ftp',
};

const DOWNLOAD_CONTROL = {
    DESKTOP: 'desktop',
    FTP: 'ftp',
    MOBILE: 'mobile',
    WEB: 'web',
};

const LIST_ACCESS_LEVEL: {
    BLACKLIST: 'blacklist',
    BLOCK: 'block',
    WHITELIST: 'whitelist',
} = {
    BLACKLIST: 'blacklist',
    BLOCK: 'block',
    WHITELIST: 'whitelist',
};

const MANAGED_USERS_ACCESS_LEVEL: {
    OWNERS_AND_COOWNERS: 'ownersCoOwners',
    OWNERS_COOWNERS_AND_EDITORS: 'ownersCoOwnersEditors',
} = {
    OWNERS_AND_COOWNERS: 'ownersCoOwners',
    OWNERS_COOWNERS_AND_EDITORS: 'ownersCoOwnersEditors',
};

const SHARED_LINK_ACCESS_LEVEL: {
    COLLAB_AND_COMPANY_ONLY: 'companyAndCollabOnly',
    COLLAB_ONLY: 'collabOnly',
    PUBLIC: 'public',
} = {
    COLLAB_AND_COMPANY_ONLY: 'companyAndCollabOnly',
    COLLAB_ONLY: 'collabOnly',
    PUBLIC: 'public',
};

export {
    ACCESS_POLICY_RESTRICTION,
    DOWNLOAD_CONTROL,
    LIST_ACCESS_LEVEL,
    MANAGED_USERS_ACCESS_LEVEL,
    MAX_APP_COUNT,
    SECURITY_CONTROLS_FORMAT,
    SHARED_LINK_ACCESS_LEVEL,
};
