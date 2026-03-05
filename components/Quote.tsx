import React, { PropsWithChildren } from "react"
import styled from "styled-components"

const Blockquote = styled.blockquote`
  margin: 1.5em 0;
  padding-left: 1em;
  border-left: 2px solid #555555;
`

const Cite = styled.cite`
  display: block;
  text-align: right;
  font-size: 0.9em;
  font-style: normal;
  opacity: 0.7;
  margin-top: 0.5em;
`

export const Attribution: React.FC<PropsWithChildren> = ({ children }) => {
  return <Cite>{children}</Cite>
}

const Quote: React.FC<PropsWithChildren> = ({ children }) => {
  return <Blockquote>{children}</Blockquote>
}

export default Quote
