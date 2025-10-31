import { createRoute } from 'honox/factory'
import Content from '../islands/Content';

export default createRoute((c) => {
  return c.render(<Content />)
});