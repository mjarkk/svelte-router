const { UrlParser } = require('url-params-parser')
const { activeRoute } = require('./store')
const { anyEmptyNestedRoutes, compareRoutes, getNamedParams, nameToPath, pathWithSearch, trimRoute } = require('./lib/utils')

let userDefinedRoutes = []
let notFoundPage = ''
let currentActiveRoute = ''
let urlParser = {}
let routeNamedParams = {}

/**
 * Updates the browser pathname and history with the active route.
 * @param currentRoute
 **/
const pushActiveRoute = currentRoute => {
  if (typeof window !== 'undefined') {
    const pathAndSearch = pathWithSearch(currentRoute)
    window.history.pushState({ page: pathAndSearch }, '', pathAndSearch)
  }
}

/**
 * Gets an array of routes and the browser pathname and return the active route
 * @param routes
 * @param basePath
 * @param pathNames
 **/
const searchActiveRoutes = (routes, basePath, pathNames) => {
  // Find the matching routes
  const filteredRoutes = routes.reduce((acc, route) => {
    let routesToMatchPath = route.name.split('/').filter(el => el)
    if (routesToMatchPath.length > pathNames.length) return acc

    // Check if the user path matches with the pathNames
    for (const i in routesToMatchPath) {
      if (!routesToMatchPath.hasOwnProperty(i)) continue

      const route = routesToMatchPath[i]
      const pathPart = pathNames[i]
      if (route.length > 1 && route[0] === ':') {
        // routeNamedParams[route.substr(1)] = pathPart
        continue
      }
      if (route !== pathPart) return acc
    }

    if (pathNames.length == routesToMatchPath.length || (pathNames.length === 1 && pathNames[0] === '/')) {
      acc.push(route)
      return acc
    }

    const basePathAppend = pathNames.slice(0, routesToMatchPath.length)
    pathNames = pathNames.slice(basePathAppend.length, pathNames.length)
    if (route.nestedRoutes) {
      basePath = `${basePath}/${basePathAppend.join('/')}`
      if (basePath === '/') {
        basePath = ''
      }
      const subRoute = searchActiveRoutes(route.nestedRoutes, basePath, pathNames)
      if (!subRoute || anyEmptyNestedRoutes(subRoute)) {
        return acc
      }

      acc.push(subRoute)
      return acc
    }

    return acc
  }, [])

  // If there are no routes found return an empty object
  if (filteredRoutes.length == 0) {
    return {}
  }

  const route = filteredRoutes[0]
  const namedPath = `${basePath}${route.name[0] === '/' ? '' : '/'}${route.name}`
  let routePath = `${basePath}/${nameToPath(route.name)}`
  if (routePath === '//') {
    routePath = '/'
  }

  const parsedParams = UrlParser(location.origin + urlParser.pathname, namedPath).namedParams
  routeNamedParams = { ...routeNamedParams, ...parsedParams }

  return {
    name: routePath,
    component: route.component,
    layout: route.layout,
    queryParams: urlParser.queryParams,
    namedParams: routeNamedParams
  }
}

/**
 * Gets an array of routes and the browser pathname and return the active route
 * @param routes
 * @param pathName
 * @param notFound
 **/
const SpaRouter = ({ routes, pathName, notFound }) => {
  if (typeof pathName === 'undefined') {
    pathName = document.location.href
  }

  if (pathName.trim().length > 1 && pathName.slice(-1) === '/') {
    pathName = pathName.slice(0, -1)
  }

  urlParser = UrlParser(pathName)

  if (typeof notFound === 'undefined') {
    notFound = ''
  }

  userDefinedRoutes = routes
  notFoundPage = notFound

  const findActiveRoute = () => {
    routeNamedParams = {}
    let currentRoute = searchActiveRoutes(routes, '', urlParser.pathNames)

    if (!currentRoute || anyEmptyNestedRoutes(currentRoute)) {
      currentRoute = { name: '404', component: notFound, path: '404' }
    } else {
      currentRoute.path = urlParser.pathname
    }

    return currentRoute
  }

  const generate = () => {
    const currentRoute = findActiveRoute()

    currentActiveRoute = currentRoute.path
    activeRoute.set(currentRoute)
    pushActiveRoute(currentRoute)

    return currentRoute
  }

  return Object.freeze({
    activeRoute: generate()
  })
}

/**
 * Updates the current active route and updates the browser pathname
 * @param pathName
 **/
const navigateTo = pathName => {
  if (pathName.trim().length > 1 && pathName[0] !== '/') {
    pathName = '/' + pathName
  }

  const activeRoute = SpaRouter({
    routes: userDefinedRoutes,
    pathName: location.origin + pathName,
    notFound: notFoundPage
  }).activeRoute

  return activeRoute
}

/**
 * Returns true if pathName is current active route
 * @param pathName
 **/
const routeIsActive = queryPath => {
  if (queryPath[0] !== '/') {
    queryPath = '/' + queryPath
  }
  let pathName = UrlParser(location.origin + queryPath).pathname
  if (pathName.slice(-1) === '/') {
    pathName = pathName.slice(0, -1)
  }
  let activeRoute = currentActiveRoute
  if (activeRoute.slice(-1) === '/') {
    activeRoute = activeRoute.slice(0, -1)
  }

  return activeRoute === pathName
}

if (typeof window !== 'undefined') {
  // Avoid full page reload on local routes
  window.addEventListener('click', event => {
    if (event.target.pathname && event.target.hostname === window.location.hostname && event.target.localName === 'a') {
      event.preventDefault()
      // event.stopPropagation()
      navigateTo(event.target.pathname + event.target.search)
    }
  })

  window.onpopstate = function (_event) {
    navigateTo(window.location.pathname + window.location.search)
  }
}

module.exports = { SpaRouter, navigateTo, routeIsActive }
