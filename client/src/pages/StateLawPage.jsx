import FeaturePage from './FeaturePage';
import { recordFeatures } from '../services/recordFeatures';
export default function StateLawPage() { return <FeaturePage config={recordFeatures['state-law']}/>; }
