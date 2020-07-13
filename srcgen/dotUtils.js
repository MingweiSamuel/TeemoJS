const PREAMBLE = `\
///////////////////////////////////////////////
//                                           //
//                     !                     //
//   This file is automatically generated!   //
//           Do not directly edit!           //
//                                           //
///////////////////////////////////////////////`;

function capitalize(input) {
    return input[0].toUpperCase() + input.slice(1);
}

function decapitalize(input) {
    return input[0].toLowerCase() + input.slice(1);
}

function toUpperCamel(input) {
    return input.split('-').map(capitalize).join('');
}

function toLowerCamel(input) {
    return decapitalize(toUpperCamel(input));
}

function formatPropType(prop, optional = false) {
    if (optional)
        return `${formatPropType(prop)} | null`;
    if ('array' === prop.type)
        return `${formatPropType(prop.items)}[]`;
    if ('object' === prop.type)
        return `{ [key: string]: ${formatPropType(prop.additionalProperties)} }`;
    if (prop.enum)
        return prop.enum.map(x => JSON.stringify(x)).join(' | ');
    if (prop.$ref) {
        const [ endpoint, model ] = prop.$ref.split('/').pop().split('.');
        return `${toLowerCamel(endpoint)}.${model}`;
    }
    return prop['x-type'];
}

function paramsToType(params, ordered = false) {
    if (!params.length)
        return ordered ? '{} | []' : '{}';

    const namedType = [ '{ ' ];
    const orderedType = [ '[ ' ];
    for (const param of params) {
        let paramType = formatPropType(param.schema);
        namedType.push(param.name);
        if (!param.required) {
            namedType.push('?');
            paramType += ' | null';
        }
        namedType.push(': ', paramType, ', ');
        orderedType.push(paramType, ', ');
    }
    // Remove trailing comma.
    namedType.pop();
    orderedType.pop();
    // Close types.
    namedType.push(' }');
    if (ordered)
        namedType.push(' | ', ...orderedType, ' ]');

    return namedType.join('');
}

const routesTable =require("./routes");
function getRouteUnionType(routes) {
    for (const [ routeType, routeValues ] of Object.entries(routesTable)) {
        if (routes.every(r => routeValues.includes(r))) {
            if (routes.length === routeValues.length)
                return routeType;
            if (routes.length >= 0.75 * routeValues.length)
                return `Exclude<${routeType}, ${routeValues.filter(r => !routes.includes(r)).map(r => `"${r}"`).join(' | ')}>`;
            return routes.map(r => `${routeType}.${r}`).join(' | ');
        }
    }
    return 'AnyRoute';
}

module.exports = {
    PREAMBLE,
    capitalize,
    decapitalize,
    toUpperCamel,
    toLowerCamel,
    formatPropType,
    paramsToType,
    getRouteUnionType,
};
