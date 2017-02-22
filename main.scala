import collection.JavaConverters._

import com.gargoylesoftware.htmlunit.WebClient
import com.gargoylesoftware.htmlunit.html.HtmlPage

import com.gargoylesoftware.htmlunit.BrowserVersion

import net.ruippeixotog.scalascraper.browser.JsoupBrowser
import net.ruippeixotog.scalascraper.browser.HtmlUnitBrowser
import net.ruippeixotog.scalascraper.dsl.DSL._
import net.ruippeixotog.scalascraper.dsl.DSL.Extract._
import net.ruippeixotog.scalascraper.dsl.DSL.Parse._
import net.ruippeixotog.scalascraper.model.Element

object Main {
       def main(args: Array[String]): Unit = {

       	   val browser = new WebClient(BrowserVersion.CHROME)
	   browser.getOptions().setThrowExceptionOnScriptError(false)
	   val page:HtmlPage = browser.getPage("https://www.snapfish.com/photo-gift/loginto")
	   println(page.getForms.asScala.map(_.getNameAttribute()))
	   println(page.getForms.asScala.map(_.asXml()))
	   println(page.getForms.asScala.tail.asXml())
	   //val form = doc >> text("form")
	   //println(form)
       }
}

