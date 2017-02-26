import collection.JavaConverters._

import com.gargoylesoftware.htmlunit.WebClient
import com.gargoylesoftware.htmlunit.html.{HtmlPage,HtmlAnchor,HtmlTextInput,HtmlPasswordInput}

import com.gargoylesoftware.htmlunit.BrowserVersion

// import net.ruippeixotog.scalascraper.browser.JsoupBrowser
// import net.ruippeixotog.scalascraper.browser.HtmlUnitBrowser
// import net.ruippeixotog.scalascraper.dsl.DSL._
// import net.ruippeixotog.scalascraper.dsl.DSL.Extract._
// import net.ruippeixotog.scalascraper.dsl.DSL.Parse._
// import net.ruippeixotog.scalascraper.model.Element

object Main {
  def main(args: Array[String]): Unit = {

    val email = args(0)
    val pass = args(1)

    val browser = new WebClient(BrowserVersion.CHROME)
    browser.getOptions().setThrowExceptionOnScriptError(false)
var page:HtmlPage = browser.getPage("https://www.snapfish.com/photo-gift/loginto")

    // The main login form is 'form1'
    val form = page.getFormByName("form1")
    println(form.asXml())

    //form.getChildren.asScala.foreach(println(_))

    val emailfield:HtmlTextInput = form.getInputByName("EmailAddress")
    emailfield.setText(email)
    val passfield:HtmlPasswordInput = form.getInputByName("Password")
    passfield.setText(pass)
    page = passfield.`type`('\n').asInstanceOf[HtmlPage]

    println(page.getByXPath("""//a[@id = "myPhotosBtn"]""").asScala.head.asInstanceOf[HtmlAnchor].asXml())
    page = page.getByXPath("""//a[@id = "myPhotosBtn"]""").asScala.head.asInstanceOf[HtmlAnchor].click()

    println(page.asText())

  }
}

