const { UrlParser } = require('url-params-parser')
const { activeRoute } = require('./store')
const { anyEmptyNestedRoutes, compareRoutes, getNamedParams, nameToPath, pathWithSearch } = require('./lib/utils')

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
  let currentRoute = {}
  let basePathName = pathNames.shift().toLowerCase()

  routes.forEach(route => {
    basePathName = compareRoutes(basePathName, pathNames, route)

    if (basePathName === nameToPath(route.name)) {
      let namedPath = `${basePath}/${route.name}`
      let routePath = `${basePath}/${nameToPath(route.name)}`
      if (routePath === '//') {
        routePath = '/'
      }

      const namedParams = getNamedParams(route.name)
      if (namedParams && namedParams.length > 0) {
        namedParams.forEach(() => {
          if (pathNames.length > 0) {
            routePath += `/${pathNames.shift()}`
          }
        })
      }

      if (currentRoute.name !== routePath) {
        const parsedParams = UrlParser(`https://fake.com${urlParser.pathname}`, namedPath).namedParams
        routeNamedParams = { ...routeNamedParams, ...parsedParams }
        currentRoute = {
          name: routePath,
          component: route.component,
          layout: route.layout,
          queryParams: urlParser.queryParams,
          namedParams: routeNamedParams
        }
      }

      if (route.nestedRoutes && route.nestedRoutes.length > 0 && pathNames.length > 0) {
        currentRoute.childRoute = searchActiveRoutes(route.nestedRoutes, routePath, pathNames)
      } else if (route.nestedRoutes && route.nestedRoutes.length > 0 && pathNames.length === 0) {
        const indexRoute = searchActiveRoutes(route.nestedRoutes, routePath, ['index'])
        if (indexRoute && Object.keys(indexRoute).length > 0) {
          currentRoute.childRoute = indexRoute
        }
      } else if (route.nestedRoutes && route.nestedRoutes.length === 0 && pathNames.length > 0) {
      }
    }
  })

  return currentRoute
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
  if (pathName.trim().length > 1 && pathName[0] === '/') {
    pathName = pathName.slice(1)
  }

  const activeRoute = SpaRouter({
    routes: userDefinedRoutes,
    pathName: 'http://fake.com/' + pathName,
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
  let pathName = UrlParser(`http://fake.com${queryPath}`).pathname
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

  window.onpopstate = function(_event) {
    navigateTo(window.location.pathname + window.location.search)
  }
}

module.exports = { SpaRouter, navigateTo, routeIsActive }
