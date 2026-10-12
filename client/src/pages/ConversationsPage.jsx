import FeaturePage from './FeaturePage';
import { recordFeatures } from '../services/recordFeatures';
export default function ConversationsPage() { return <FeaturePage config={recordFeatures.conversations}/>; }
