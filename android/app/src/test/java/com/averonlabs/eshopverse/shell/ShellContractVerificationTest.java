package com.averonlabs.eshopverse.shell;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import java.io.File;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

public class ShellContractVerificationTest {

    private static final File REPO_ROOT = findRepoRoot();

    private static File findRepoRoot() {
        File current = new File(".").getAbsoluteFile();
        while (current != null) {
            if (new File(current, "android/app/src/main/AndroidManifest.xml").exists()) {
                return current;
            }
            if (new File(current, "app/src/main/AndroidManifest.xml").exists()) {
                return current.getParentFile();
            }
            current = current.getParentFile();
        }
        return new File(".");
    }

    private Document parseXml(File file) throws Exception {
        assertTrue("File must exist: " + file.getAbsolutePath(), file.exists());
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        return builder.parse(file);
    }

    @Test
    public void testManifestDeclaresRequiredPermissionsAndSecurityConfig() throws Exception {
        File manifestFile = new File(REPO_ROOT, "android/app/src/main/AndroidManifest.xml");
        Document doc = parseXml(manifestFile);

        NodeList permissions = doc.getElementsByTagName("uses-permission");
        boolean hasInternet = false;
        boolean hasNetworkState = false;

        for (int i = 0; i < permissions.getLength(); i++) {
            Element elem = (Element) permissions.item(i);
            String name = elem.getAttributeNS("http://schemas.android.com/apk/res/android", "name");
            if ("android.permission.INTERNET".equals(name)) {
                hasInternet = true;
            }
            if ("android.permission.ACCESS_NETWORK_STATE".equals(name)) {
                hasNetworkState = true;
            }
        }

        assertTrue("Manifest must declare INTERNET permission", hasInternet);
        assertTrue("Manifest must declare ACCESS_NETWORK_STATE permission", hasNetworkState);

        NodeList appNodes = doc.getElementsByTagName("application");
        assertEquals(1, appNodes.getLength());
        Element app = (Element) appNodes.item(0);
        String netSecConfig = app.getAttributeNS("http://schemas.android.com/apk/res/android", "networkSecurityConfig");
        assertEquals("@xml/network_security_config", netSecConfig);
    }

    @Test
    public void testNetworkSecurityConfigs() throws Exception {
        File releaseConfig = new File(REPO_ROOT, "android/app/src/main/res/xml/network_security_config.xml");
        Document releaseDoc = parseXml(releaseConfig);
        NodeList releaseBaseConfig = releaseDoc.getElementsByTagName("base-config");
        assertTrue("Release config must have base-config", releaseBaseConfig.getLength() > 0);
        Element base = (Element) releaseBaseConfig.item(0);
        assertEquals("false", base.getAttribute("cleartextTrafficPermitted"));

        File debugConfig = new File(REPO_ROOT, "android/app/src/debug/res/xml/network_security_config.xml");
        Document debugDoc = parseXml(debugConfig);
        NodeList domains = debugDoc.getElementsByTagName("domain");
        boolean hasLocalhost = false;
        boolean hasEmulatorHost = false;
        boolean hasLoopback = false;

        for (int i = 0; i < domains.getLength(); i++) {
            String domain = domains.item(i).getTextContent().trim();
            if ("localhost".equals(domain)) hasLocalhost = true;
            if ("10.0.2.2".equals(domain)) hasEmulatorHost = true;
            if ("127.0.0.1".equals(domain)) hasLoopback = true;
        }

        assertTrue("Debug config must allow localhost", hasLocalhost);
        assertTrue("Debug config must allow 10.0.2.2", hasEmulatorHost);
        assertTrue("Debug config must allow 127.0.0.1", hasLoopback);
    }

    @Test
    public void testBottomNavMenuDeclaresFourDestinations() throws Exception {
        File menuFile = new File(REPO_ROOT, "android/app/src/main/res/menu/bottom_nav_menu.xml");
        Document doc = parseXml(menuFile);
        NodeList items = doc.getElementsByTagName("item");
        assertEquals(4, items.getLength());

        boolean hasHome = false;
        boolean hasExplore = false;
        boolean hasCart = false;
        boolean hasAccount = false;

        for (int i = 0; i < items.getLength(); i++) {
            Element item = (Element) items.item(i);
            String id = item.getAttributeNS("http://schemas.android.com/apk/res/android", "id");
            if ("@+id/homeFragment".equals(id)) hasHome = true;
            if ("@+id/exploreFragment".equals(id)) hasExplore = true;
            if ("@+id/cartFragment".equals(id)) hasCart = true;
            if ("@+id/accountFragment".equals(id)) hasAccount = true;
        }

        assertTrue(hasHome);
        assertTrue(hasExplore);
        assertTrue(hasCart);
        assertTrue(hasAccount);
    }

    @Test
    public void testNavigationGraphsParallelismContract() throws Exception {
        File navMainFile = new File(REPO_ROOT, "android/app/src/main/res/navigation/nav_main.xml");
        Document mainDoc = parseXml(navMainFile);
        Element mainRoot = mainDoc.getDocumentElement();
        assertEquals("@+id/nav_main", mainRoot.getAttributeNS("http://schemas.android.com/apk/res/android", "id"));
        assertEquals("@id/homeFragment", mainRoot.getAttributeNS("http://schemas.android.com/apk/res-auto", "startDestination"));

        NodeList includes = mainDoc.getElementsByTagName("include");
        assertEquals(5, includes.getLength());

        // Validate nested graphs
        assertNestedGraph("nav_catalog.xml", "@+id/nav_catalog", null);
        assertNestedGraph("nav_auth.xml", "@+id/nav_auth", "returnToNavId");
        assertNestedGraph("nav_cart.xml", "@+id/nav_cart", null);
        assertNestedGraph("nav_checkout.xml", "@+id/nav_checkout", "shippingAddressId");
        assertNestedGraph("nav_orders.xml", "@+id/nav_orders", "orderId");
    }

    private void assertNestedGraph(String filename, String expectedRootId, String expectedArg) throws Exception {
        File file = new File(REPO_ROOT, "android/app/src/main/res/navigation/" + filename);
        Document doc = parseXml(file);
        Element root = doc.getDocumentElement();
        assertEquals("Graph root id in " + filename, expectedRootId,
                root.getAttributeNS("http://schemas.android.com/apk/res/android", "id"));

        if (expectedArg != null) {
            NodeList args = doc.getElementsByTagName("argument");
            boolean found = false;
            for (int i = 0; i < args.getLength(); i++) {
                Element arg = (Element) args.item(i);
                String name = arg.getAttributeNS("http://schemas.android.com/apk/res/android", "name");
                if (expectedArg.equals(name)) {
                    found = true;
                    break;
                }
            }
            assertTrue("Expected argument '" + expectedArg + "' in " + filename, found);
        }
    }

    @Test
    public void testShellFragmentsInstantiation() {
        assertNotNull(new HomeFragment());
        assertNotNull(new ExploreFragment());
        assertNotNull(new CartFragment());
        assertNotNull(new AccountFragment());
        assertNotNull(new PlaceholderFragment());
    }
}
