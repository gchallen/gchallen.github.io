import React from "react"
import YoutubePlayer from "react-youtube"
import styled from "styled-components"
import classes from "./YouTube.module.css"

const Outer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
`
const Centerer = styled.div`
  flex: 1;
  max-width: 640px;
`

const YouTube: React.FC<{ id: string }> = ({ id }) => {
  return (
    <Outer>
      <Centerer>
        <YoutubePlayer
          videoId={id}
          opts={{ playerVars: { autoplay: 0, rel: 0, modestbranding: 1 } }}
          containerClassName={classes.wrapper}
          className={classes.iframe}
        />
      </Centerer>
    </Outer>
  )
}

export default YouTube
