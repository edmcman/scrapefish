import collection.JavaConverters._

import com.gargoylesoftware.htmlunit.WebClient
import com.gargoylesoftware.htmlunit.html.{HtmlPage,HtmlAnchor,HtmlTextInput,HtmlPasswordInput}

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
    var page:HtmlPage = browser.getPage("https://www.snapfish.com/photo-gift/loginto")

    // The main login form is 'form1'
    val form = page.getFormByName("form1")
    println(form.asXml())

    //form.getChildren.asScala.foreach(println(_))

    val email:HtmlTextInput = form.getInputByName("EmailAddress")
    email.setText("test@email.com")
    val password:HtmlPasswordInput = form.getInputByName("Password")
    password.setText("testpass")
    page = password.`type`('\n').asInstanceOf[HtmlPage]
    println(page.asText())

  }
}

