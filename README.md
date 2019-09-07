# Svelte Router

![version](https://img.shields.io/npm/v/svelte-router-spa.svg)
![license](https://img.shields.io/github/license/jorgegorka/svelte-router.svg)
![Code climate](https://img.shields.io/codeclimate/maintainability/jorgegorka/svelte-router.svg)

## What is Svelte Router?

Svelte Router adds routing to your Svelte apps.

It keeps your routes organized in a single place.

It's specially designed for Single Page Applications (SPA). If you need Server Side Rendering then consider using [Sapper](https://sapper.svelte.dev/).

## Features

- Define your routes in a single interface
- Layouts global, per page or nested.
- Nested routes
- Named params

Svelte Router is smart enought to inject the corresponding params to each Route component. Every Route component has information about their named params, query params and child route.

You can use all that information (availabe in the currentRoute prop) to help you implement your business logic and secure the app.

## Install

To install Svelte Router on your svelte app:

with npm

```bash
npm i svelte-router-spa
```

with Yarn

```bash
yarn add svelte-router-spa
```

## Usage

Add a routes.js file with your routes info. Example:

```javascript
import Login from './views/public/login.svelte'
import PublicIndex from './views/public/index.svelte'
import PublicLayout from './views/public/layout.svelte'
import AdminLayout from './views/admin/layout.svelte'
import AdminIndex from './views/admin/index.svelte'
import EmployeesIndex from './views/admin/employees/index.svelte'

const routes = [
  {
    name: '/',
    component: PublicLayout
  },
  { name: 'login', component: Login, layout: PublicLayout },
  {
    name: 'admin',
    component: AdminLayout,
    nestedRoutes: [
      { name: 'index', component: AdminIndex },
      {
        name: 'employees',
        component: '',
        nestedRoutes: [{ name: 'index', component: EmployeesIndex }, { name: 'show/:id', component: EmployeesShow }]
      }
    ]
  }
]

export { routes }
```

Import the routes into main.js

```javascript
import App from './App.svelte'
import { SpaRouter } from 'svelte-router-spa'
import { routes } from './routes'
import NotFound from './views/not_found.svelte'

SpaRouter({
  routes,
  pathName: document.location.href,
  notFound: NotFound
}).getActiveRoute

const app = new App({
  target: document.body
})

export default app
```

Edit App.svelte and add the main router.

```javascript
<script>
  import { Router } from 'svelte-router-spa'
</script>

<Router />
```

You can add any number of layouts nested inside Router. For instance assuming that I want two layouts one for public pages and the other for private admin pages I would create these two files:

Every Route file will receive a currentRoute prop with information about the current route, params, queries, etc.

Filename: _public_layout.svelte_

```javascript
<script>
  import { Route } from 'svelte-router-spa'
  import TopHeader from './top_header.svelte'
  export let currentRoute
</script>

<div class="app">
  <TopHeader />
  <section class="section">
    <Route {currentRoute} />
  </section>
</div>
```

Filename: _admin_layout.svelte_

```javascript
<script>
  import { Route } from "svelte-router-spa";

  export let currentRoute;
</script>

<div>
  <h1>Admin Layout</h1>
  <Route {currentRoute} />
</div>
```

The route page will take care of rendering the appropriate component inside the layout. It will also pass a prop called _currentRoute_ to the component with information about the route, nested and query params.

**Tip:** You can have any number of layouts and you can nest them into each other as much as you want. Just remember to add a _Route_ component where the content should be rendered inside the layout.

**Tip:** The _Route_ component will pass a prop to the rendered component named _currentRoute_ with information about the current route, params, queries, etc.

## API

### SpaRouter

`import { SpaRouter } from 'svelte-router-spa'`

This object receives three params: routes, pathName and notFound.

**routes** An array of routes.

**pathName** The path name to evaluate. For instance 'https://www.mysite.com/admin/employees?show-all=false'. It defaults to _document.location.href_

**notFound** A svelte component that will be rendered if the route can not be found.

It exposes a single property called _currentRoute_ that will return the current active route and some additional information (see below.)

Routes can contain as many nested routes as needed.

It can also contain as many layouts as needed. Layouts can be nested into other layouts.

In the following example both the home root ('/' and 'login' will use the same layout). Admin, employees and employeesShow will use the admin layout.

Example of routes:

```javascript
const routes = [
  {
    name: '/',
    component: PublicIndex,
    layout: PublicLayout
  },
  { name: 'login', component: Login, layout: PublicLayout },
  {
    name: 'admin',
    component: AdminIndex,
    layout: AdminLayout,
    nestedRoutes: [
      {
        name: 'employees',
        component: EmployeesIndex,
        nestedRoutes: [
          {
            name: 'show/:id',
            component: EmployeesShowLayout,
            nestedRoutes: [{ name: 'index', component: EmployeesShow }, { name: 'list', component: EmployeesShowList }]
          }
        ]
      }
    ]
  }
]
```

The routes that this file will parse successfully are:

```
/
/login
/admin
/admin/employees
/admin/employees/show
/admin/employees/show/{id}
/admin/employees/show/{id}/list
```

### Router

`import { Router } from 'svelte-router-spa'`

This is the main component that needs to be included before any other content as it holds information about which route should be rendered.

The best approach (although not required) is to have an App.svelte file like this:

```javascript
<script>
  import { Router } from 'svelte-router-spa'
</script>

<Router />
```

The layout and/or the component that matches the active route will be rendered inside _Router_.

## Route

`import { Route } from 'svelte-router-spa'`

This component is only needed if you create a layout. It will take care of rendering the content for the child components or child layouts recursively. You can have as many nested layouts as you need.

The info about the current route will be received as a prop so you need to define _currentRoute_ and export it.

currentRoute has all the information about the current route and the child routes

Route is smart enough to expose the named params in the route component where they will be rendered.

Example:

```javascript
<script>
  import { Route } from 'svelte-router-spa'
  import TopHeader from './top_header.svelte'
  import FooterContent from './footer_content.svelte'
  export let currentRoute
</script>

<div class="app">
  <TopHeader />
  <section class="section">
    <Route {currentRoute} />
    <p>Current params are: {currentRoute.namedParams} and {currentRoute.queryParams}
  </section>
  <FooterContent />
</div>
```

## currentRoute

This prop is propagated from _Route_ to the components it renders. It contains information about the current route and the child routes.

**Example:**

```javascript
const routes = [
  {
    name: '/public',
    component: PublicLayout,
    nestedRoutes: [
      {
        name: 'about-us',
        component: 'AboutUsLayout',
        nestedRoutes: [
          { name: 'company', component: CompanyPage }, 
          { name: 'people', component: PeoplePage },
          { name: 'people/:name', component: PeoplePage },
        ]
      }
    ]
  }
]
```

That configuration will parse correctly the following routes:

```javascript
/public
/public/about-us
/public/about-us/company
/public/about-us/people/:name
```

If the user visits /public/about-us/people/jack the following components will be rendered:

```
Router -> PublicLayout(Route) -> AboutUsLayout(Route) -> PeoplePage
```

Inside PeoplePage you can get all the information about the current route like this:

```javascript
<script>
  export let currentRoute
</script>

<h1>Your name is: {currentRoute.namedParams.name}</h1>
```

This will render:

```html
<h1>Your name is: Jack</h1>
```

## Navigate

`import { Navigate } from 'svelte-router-spa'`

Navigate is a wrapper around the < a href="" > element to help you generate links quickly and easily.

It adds an _active_ class if the generated route is the active one.

Example:

```javascript
<script>
  import { Navigate } from 'svelte-router-spa'
</script>

<div class="app">
  <h1>My content</h1>
  <p>Now I want to generate a <Navigate to="admin/employees">link to /admin/employees</Navigate>
</div>
```

### navigateTo

`import { navigateTo } from 'svelte-router-spa'`

navigateTo allows you to programatically navigate to a route from inside your app code.

navigateTo receives a path name as a param and will try to navigate to that route.

Example:

```javascript
if (loginSuccess) {
  navigateTo('admin')
} else {
  navigateTo('login')
}
```

### routeIsActive

`import { routeIsActive } from 'svelte-router-spa'`

Returns a boolean if the path is the current active route.

This is useful, for instance to set an _active_ class on a menu.

The [Navigate](https://github.com/jorgegorka/svelte-router/blob/master/README.md#navigate) component does this automatically and adds an _active_ class if the generated route is the active one.

Example:

```javascript
import { routeIsActive } from 'svelte-router-spa'

<a href="/contact-us" class:active={routeIsActive('/contact-us')}>
  Say hello
</a>
```

## Credits

Svelte Router SPA has been developed by [Jorge Alvarez](https://www.alvareznavarro.es).
