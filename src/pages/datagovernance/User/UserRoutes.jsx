import { Route } from 'react-router-dom';
import Role from './Role';
import User from './User';
import Group from './Group';
import Persona from './Persona';

const PREFIX = '/datagovernance/user';

export const UserRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<User />} />
    <Route path={`${PREFIX}/role`} element={<Role />} />
    <Route path={`${PREFIX}/group`} element={<Group />} />
    <Route path={`${PREFIX}/persona`} element={<Persona />} />
  </>
);
