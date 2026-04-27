import { NextPage, NextPageContext } from "next"
import ErrorPage from "../components/ErrorPage"

interface ErrorProps {
  statusCode: number
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  const code = String(statusCode)
  const display = code.length === 3 ? code : "ERR"
  const heading = statusCode >= 500 ? "Server Error" : "Something Went Wrong"
  return (
    <ErrorPage code={display} title={heading} heading={heading}>
      Sorry, something went wrong.
    </ErrorPage>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err.statusCode ?? 500) : 404
  return { statusCode }
}

export default Error
