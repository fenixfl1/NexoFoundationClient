import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router'
import { publicRoutes, privateRoutes } from './auto-routes'
import {
  PATH_HOME,
  PATH_ROLE_ADMIN,
  PATH_ROLE_STUDENT,
} from 'src/constants/routes'
import AuthGuard from './AuthGuard'
import GuestGuard from './GuestGuard'
import ErrorElement from 'src/pages/error'
import { activityParameterLoader } from 'src/pages/loader'
import RoleRedirect from './RoleRedirect'

const router = () =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route errorElement={<ErrorElement />}>
        <Route element={<GuestGuard />}>
          {publicRoutes.map(({ path, loader, element }, key) => (
            <Route element={element} key={key} loader={loader} path={path} />
          ))}
        </Route>

        <Route element={<AuthGuard />}>
          <Route path={PATH_HOME} element={<RoleRedirect />} />
          <Route
            path={`/${PATH_ROLE_ADMIN}`}
            element={<RoleRedirect />}
          />
          <Route
            path={`/${PATH_ROLE_STUDENT}`}
            element={<RoleRedirect />}
          />
          <Route path={`/${PATH_ROLE_ADMIN}/:activityId`}>
            {privateRoutes.map(
              ({ path, loader = activityParameterLoader, element }, key) => (
                <Route
                  element={element}
                  key={key}
                  loader={loader}
                  path={path}
                />
              )
            )}
          </Route>
          <Route path={`/${PATH_ROLE_STUDENT}/:activityId`}>
            {privateRoutes.map(
              ({ path, loader = activityParameterLoader, element }, key) => (
                <Route
                  element={element}
                  key={key}
                  loader={loader}
                  path={path}
                />
              )
            )}
          </Route>
        </Route>
      </Route>
    )
  )

export default router
