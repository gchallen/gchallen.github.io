#!/usr/bin/env node

import glob from "glob-promise"
import fs from "fs/promises"
import moment from "moment"
import { Feed } from "feed"

Promise.resolve().then(async () => {
  const essays = await Promise.all(
    (await glob("output/essays/**/*.json"))
      .map((file) => fs.readFile(file))
      .map(async (content) => JSON.parse((await content).toString()))
  ).then((essays) =>
    essays.sort((a, b) => new Date(a.published ?? new Date()).valueOf() - new Date(b.published ?? new Date()).valueOf())
  )
  const published = essays
    .filter((essay) => essay.published)
    .map((essay) => {
      return { ...essay, publishedAt: moment(essay.published).utc().format("YYYY-MM-DD") }
    })
  const feed = new Feed({
    title: "Geoffrey Challen, Teaching Faculty",
    description:
      "Hi, I'm Geoff Challen. I love to teach, and I love to code. I teach students to code. " +
      "And I write code that helps them learn.",
    id: "https://www.geoffreychallen.com",
    link: "https://www.geoffreychallen.com",
    language: "en",
    image: "https://www.geoffreychallen.com/cartoon-light.png",
    favicon: "https://www.geoffreychallen.com/favicon.ico",
    copyright: `All rights reserved ${new Date().getFullYear()}, Geoffrey Challen`,
    feedLinks: {
      json: "https://www.geoffreychallen.com/feed.json",
      atom: "https://www.geoffreychallen.com/atom.xml",
    },
    author: {
      name: "Geoffrey Challen",
      email: "geoffrey.challen@gmail.com",
      link: "https://www.geoffreychallen.com",
    },
  })
  for (const post of published) {
    feed.addItem({
      title: post.title,
      id: `https://www.geoffreychallen.com/${post.url}`,
      link: `https://www.geoffreychallen.com/${post.url}`,
      description: post.description,
      date: new Date(post.publishedAt),
    })
  }
  await fs.writeFile("public/rss.xml", feed.rss2())
  await fs.writeFile("public/atom.xml", feed.atom1())
  await fs.writeFile("public/feed.json", feed.json1())
})
