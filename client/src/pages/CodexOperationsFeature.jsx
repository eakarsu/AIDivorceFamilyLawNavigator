import FeaturePage from './FeaturePage';
import { recordFeatures } from '../services/recordFeatures';
export default function CodexOperationsFeature() { return <FeaturePage config={recordFeatures.operations}/>; }
