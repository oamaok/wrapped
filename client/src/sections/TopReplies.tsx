import * as data from '../../../data'
import Message from '../Message'
import MessageColumns from '../MessageColumns'
import Section from '../Section'

const TOP_MESSAGES = data.topReplies

const TopReplies = () => {
  return <MessageColumns messages={TOP_MESSAGES} />
}

export default TopReplies
