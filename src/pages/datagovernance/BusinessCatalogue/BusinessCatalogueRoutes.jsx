import { Route } from 'react-router-dom';
import BusinessCatalogue from './BusinessCatalogue';
import BusinessGlossary from './BusinessGlossary';


const PREFIX = '/datagovernance/business-catalogue';

export const BusinessCatalogueRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<BusinessCatalogue />} />
    <Route path={`${PREFIX}/glossary`} element={<BusinessGlossary />} />
  </>
);
