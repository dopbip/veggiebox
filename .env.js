const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
};

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '8000',
    Meta_WA_VerifyToken: 'panda_in_space',
    Meta_WA_accessToken: 'EAAICMPLTiqUBAMo6dFeIpAAK7uZBT1jZABVZBh00iNchJaNnELGoPycnxVdyolearZAlgwX6uxeUGIyb3lUWQHdcuxzlkc7N6mCi8XNw27oZARUxaFf7s1Q8MlqoG3jVZBddZBHuJNPFZBgrIVeAN4xQE0ZCIcE2drqiUo0r0J6fsPZA2Y1sjRzqJgeGsacorYWFyc5A5w3N31v1jxH2KvGcz8',
    Meta_WA_SenderPhoneNumberId: '118618771205644',
    Meta_WA_wabaId: '118416884561172',
};

const fallback = {
    ...process.env,
    NODE_ENV: undefined,
};

module.exports = (environment) => {
    console.log(`Execution environment selected is: "${environment}"`);
    if (environment === 'production') {
        return production;
    } else if (environment === 'development') {
        return development;
    } else {
        return fallback;
    }
};