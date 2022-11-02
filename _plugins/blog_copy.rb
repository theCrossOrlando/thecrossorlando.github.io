require 'time'
require 'open-uri'
require 'nokogiri'

module Jekyll

  class GeneratePosts < Generator
    safe true
    priority :high

    def generate(site)
      doc = Nokogiri::XML(URI.open("https://tcandk.wordpress.com/feed/"))
      blog_title = doc.xpath("/rss/channel/title").text
      site.data["posts"] = []

      doc.xpath("/rss//item").each do |node|
        site.data["posts"] << {
          "blog" => blog_title,
          "title" => node.at_xpath("./title").text,
          "summary" => node.at_xpath("./description").text,
          "author" => node.at_xpath("./dc:creator").text,
          "link" => node.at_xpath("./link").text,
          "pubDate" => Time.parse(node.at_xpath("./pubDate").text)
        }
      end

    end

  end

end
