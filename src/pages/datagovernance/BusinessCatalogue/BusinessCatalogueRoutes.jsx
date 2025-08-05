import { Route } from 'react-router-dom';
import BusinessCatalogue from './BusinessCatalogue';
import BusinessGlossary from './BusinessGlossary';
import DetailsPage from './DetailsPage';


const PREFIX = '/datagovernance/business-catalogue';

export const BusinessCatalogueRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<BusinessCatalogue />} />
    <Route path={`${PREFIX}/glossary`} element={<BusinessGlossary />} />
    <Route path={`${PREFIX}/glossary/:itemName`} element={<DetailsPage />} />
  </>
);
